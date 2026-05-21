import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Loader2, 
  Check, 
  X, 
  RefreshCw,
  AlertCircle,
  Clock
} from 'lucide-react';

interface OTPInputProps {
  phoneNumber: string;
  purpose: 'phone_verification' | 'login' | 'transaction' | 'address_verification' | 'password_reset';
  onVerified?: (userId?: string) => void;
  onCancel?: () => void;
  autoSend?: boolean;
  className?: string;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  phoneNumber,
  purpose,
  onVerified,
  onCancel,
  autoSend = false,
  className = ''
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-send OTP on mount if enabled
  useEffect(() => {
    if (autoSend && !otpSent) {
      sendOTP();
    }
  }, [autoSend]);

  // Countdown timer for expiration
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setError('OTP has expired. Please request a new one.');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const interval = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCooldown]);

  const sendOTP = async () => {
    setIsSending(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          purpose
        })
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setExpiresAt(data.expiresAt ? new Date(data.expiresAt) : null);
        setResendCooldown(300); // 300 seconds (5 minutes) cooldown - matches OTP expiry
        
        // In development, show OTP code if SMS is disabled
        if (data.otpCode) {
          setError(`Development Mode: OTP is ${data.otpCode}`);
        }
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Only accept 6-digit numbers
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      
      // Auto-verify
      verifyOTP(pastedData);
    }
  };

  const verifyOTP = async (otpCode: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          otp_code: otpCode,
          purpose
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsVerified(true);
        if (onVerified) {
          onVerified(data.userId);
        }
      } else {
        setError(data.message || 'Invalid OTP code');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError('Failed to verify OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setOtp(['', '', '', '', '', '']);
    setError('');
    await sendOTP();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isVerified) {
    return (
      <div className={`bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center ${className}`}>
        <div className="flex items-center justify-center mb-3">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
            <Check className="h-8 w-8 text-white" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-green-900 mb-1">Verified!</h3>
        <p className="text-sm text-green-700">Your phone number has been verified successfully</p>
      </div>
    );
  }

  if (!otpSent) {
    return (
      <div className={`bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center ${className}`}>
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Verify Your Phone Number</h3>
        <p className="text-sm text-gray-600 mb-4">
          We'll send a 6-digit code to <strong>{phoneNumber}</strong>
        </p>
        <Button
          onClick={sendOTP}
          disabled={isSending}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending OTP...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Send Verification Code
            </>
          )}
        </Button>
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="ghost"
            className="w-full mt-2"
          >
            Cancel
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border-2 border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Enter Verification Code</h3>
        <p className="text-sm text-gray-600 mb-2">
          We sent a 6-digit code to <strong>{phoneNumber}</strong>
        </p>
        {timeRemaining > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 inline-flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <div className="text-sm">
              <span className="text-blue-600 font-medium">Code expires in: </span>
              <span className="text-blue-900 font-bold">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        )}
      </div>

      {/* OTP Input Fields */}
      <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <Input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={isLoading}
            className="w-12 h-14 text-center text-2xl font-bold border-2 focus:border-blue-500"
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Verifying...</span>
        </div>
      )}

      {/* Resend Button */}
      <div className="text-center">
        {resendCooldown > 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 inline-flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <div className="text-sm">
              <span className="text-gray-600">Request new code in: </span>
              <span className="text-gray-900 font-bold">{formatTime(resendCooldown)}</span>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleResend}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Resend Verification Code
          </Button>
        )}
      </div>

      {/* Cancel Button */}
      {onCancel && (
        <Button
          onClick={onCancel}
          variant="outline"
          className="w-full mt-4"
          disabled={isLoading}
        >
          Cancel
        </Button>
      )}
    </div>
  );
};

export default OTPInput;
