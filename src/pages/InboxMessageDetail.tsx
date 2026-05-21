import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ModernPDFGenerator } from '@/utils/modernPDFGenerator';
import {
  ArrowLeft,
  Mail,
  Printer,
  Download,
  MoreVertical,
  Building2,
  ExternalLink
} from 'lucide-react';

interface InboxMessage {
  id: string;
  subject: string;
  message_body: string;
  message_type: string;
  priority: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  sent_at: string;
  reference_number?: string;
  metadata?: any;
  sender_type?: string;
  sender?: {
    organization_name: string;
    organization_code: string;
    logo_url?: string;
  };
  company_sender?: {
    company_name: string;
    company_code: string;
    logo_url?: string;
    industry?: string;
  };
}

export default function InboxMessageDetail() {
  const { messageId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState<InboxMessage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (messageId) {
      fetchMessage();
    }
  }, [messageId]);

  const fetchMessage = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/inbox/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(data.data);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load message",
          variant: "destructive"
        });
        navigate('/dashboard/inbox');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load message. Please check console for details.",
        variant: "destructive"
      });
      navigate('/dashboard/inbox');
    } finally {
      setLoading(false);
    }
  };

  const markAsUnread = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/inbox/${messageId}/unread`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      toast({
        title: "Marked as unread",
        description: "Message marked as unread"
      });
      navigate('/dashboard/inbox');
    } catch (error) {
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!message) return;
    
    try {
      toast({
        title: "🔄 Generating PDF...",
        description: "Creating your modern document with KIVRO branding."
      });

      // Create modern PDF generator
      const pdfGenerator = new ModernPDFGenerator();
      
      // Generate modern PDF
      const blob = await pdfGenerator.generateMessagePDF(message);
      const fileName = pdfGenerator.getFileName(message);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ PDF Downloaded",
        description: `${fileName} has been saved to your downloads.`
      });
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading message...</p>
        </div>
      </div>
    );
  }

  if (!message) {
    return null;
  }

  const senderName = message.sender_type === 'company' 
    ? (message.company_sender?.company_name || 'Company') 
    : (message.sender?.organization_name || 'Government Agency');

  const senderLogo = message.sender_type === 'company'
    ? message.company_sender?.logo_url
    : message.sender?.logo_url;

  const messageDate = new Date(message.sent_at);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: Back button, Logo, Sender name */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard/inbox')}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                  {senderLogo ? (
                    <img 
                      src={senderLogo} 
                      alt={senderName}
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) (fallback as HTMLElement).style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <Building2 
                    className="w-5 h-5 text-blue-600" 
                    style={{ display: senderLogo ? 'none' : 'block' }}
                  />
                </div>
                <h1 className="text-lg font-semibold text-gray-900">{senderName}</h1>
              </div>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAsUnread}
                className="hidden sm:flex"
              >
                <Mail className="h-4 w-4 mr-2" />
                Mark as unread
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="icon"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Message Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Received Date */}
            <div className="text-sm text-gray-600 font-normal">
              Received {messageDate.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>

            {/* Message Body */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="prose max-w-none">
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-normal">
                  {message.message_body}
                </p>
              </div>
            </div>

            {/* Invoice/Bill Details */}
            {message.metadata?.fine_amount && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="grid grid-cols-2 gap-8">
                  {/* Sender Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base mb-3">{senderName}</h3>
                    <div className="space-y-1 text-xs text-gray-600 font-normal">
                      {message.metadata?.business_number && (
                        <p><span className="font-medium">Business Number</span> {message.metadata.business_number}</p>
                      )}
                      {message.metadata?.sender_address && (
                        <p className="leading-relaxed">{message.metadata.sender_address}</p>
                      )}
                      {message.metadata?.sender_city && message.metadata?.sender_postal && (
                        <p>{message.metadata.sender_city}</p>
                      )}
                      {message.metadata?.sender_postal && (
                        <p>{message.metadata.sender_postal}</p>
                      )}
                      {message.metadata?.sender_phone && (
                        <p>📞 {message.metadata.sender_phone}</p>
                      )}
                      {message.metadata?.sender_email && (
                        <p>✉️ {message.metadata.sender_email}</p>
                      )}
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="text-right space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">{message.metadata?.invoice_label || 'SKATTEVERKET'}</p>
                      <p className="text-sm font-normal text-gray-600">{message.reference_number || 'INV0001'}</p>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">DATE</p>
                      <p className="text-sm font-normal text-gray-600">
                        {messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    {message.metadata?.due_date && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">DUE</p>
                        <p className="text-sm font-normal text-gray-600">On Receipt</p>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-200 mt-3">
                      <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">BALANCE DUE</p>
                      <p className="text-base font-semibold text-gray-900">
                        PKR {message.metadata?.fine_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bill To */}
                {message.metadata?.recipient_info && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">BILL TO</h4>
                    <div className="text-xs text-gray-600 space-y-1 font-normal">
                      <p className="font-semibold text-gray-900">{message.metadata.recipient_info.name || senderName}</p>
                      <p className="leading-relaxed">{message.metadata.recipient_info.address}</p>
                      {message.metadata.recipient_info.city && (
                        <p>{message.metadata.recipient_info.city}</p>
                      )}
                      {message.metadata.recipient_info.postal && (
                        <p>{message.metadata.recipient_info.postal}</p>
                      )}
                      {message.metadata.recipient_info.phone && (
                        <p>📞 {message.metadata.recipient_info.phone}</p>
                      )}
                      {message.metadata.recipient_info.tax_id && (
                        <p>📄 {message.metadata.recipient_info.tax_id}</p>
                      )}
                      {message.metadata.recipient_info.email && (
                        <p>✉️ {message.metadata.recipient_info.email}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Payment Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24 space-y-6">
              {/* Amount Display */}
              {message.metadata?.fine_amount && (
                <>
                  <div className="text-center pb-6 border-b border-gray-200">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {message.metadata?.fine_amount?.toLocaleString('en-US', { minimumFractionDigits: 0 })} kr
                    </div>
                    {message.metadata?.due_date && (
                      <div className="text-sm text-gray-600">
                        Due {new Date(message.metadata.due_date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {message.metadata?.payment_status || 'Unhandled'}
                    </span>
                  </div>

                  {/* Pay Now Button */}
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-base">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Pay Now
                  </Button>
                </>
              )}

              {/* Invoice Details */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 text-sm">Invoice Details</h4>
                
                {/* OCR Number */}
                {message.metadata?.ocr_number && (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-medium">OCR</div>
                      <div className="text-sm font-medium text-gray-900">{message.metadata.ocr_number}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => {
                        navigator.clipboard.writeText(message.metadata.ocr_number);
                        toast({ title: "Copied!", description: "OCR number copied to clipboard" });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                )}

                {/* Bankgiro */}
                {message.metadata?.bankgiro && (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-medium">Bankgiro</div>
                      <div className="text-sm font-medium text-gray-900">{message.metadata.bankgiro}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => {
                        navigator.clipboard.writeText(message.metadata.bankgiro);
                        toast({ title: "Copied!", description: "Bankgiro number copied to clipboard" });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                )}
              </div>

              {/* Mark as Handled Section */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Paid this somewhere else?</span>
                  <p className="text-xs text-gray-500 mt-1">Mark as handled to stop receiving notifications</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    toast({
                      title: "Marked as handled",
                      description: "You won't receive notifications for this message"
                    });
                  }}
                >
                  Mark as handled
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
