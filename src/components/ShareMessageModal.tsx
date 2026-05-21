import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Share2, 
  Copy, 
  Mail, 
  MessageSquare,
  Check,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface ShareMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: InboxMessage | null;
}

const ShareMessageModal: React.FC<ShareMessageModalProps> = ({ isOpen, onClose, message }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!message) return null;

  const senderName = message.sender_type === 'company' 
    ? (message.company_sender?.company_name || 'Company') 
    : (message.sender?.organization_name || 'Government Agency');

  const senderCode = message.sender_type === 'company' 
    ? message.company_sender?.company_code 
    : message.sender?.organization_code;

  const senderIcon = message.sender_type === 'government' ? '🏛️' : '🏢';
  
  const priorityEmoji = message.priority === 'urgent' ? '🚨' 
    : message.priority === 'high' ? '⚠️' 
    : '📋';

  const formattedDate = new Date(message.sent_at).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const generateShareText = () => {
    return `
╔═══════════════════════════════════════════╗
║           📬 KIVRO INBOX MESSAGE          ║
║    Digital Address & Communication        ║
╚═══════════════════════════════════════════╝

${priorityEmoji} SUBJECT:
${message.subject}

${senderIcon} FROM:
${senderName}
${senderCode ? `Code: ${senderCode}` : ''}

📅 DATE:
${formattedDate}

${message.reference_number ? `📋 REFERENCE NUMBER:\n${message.reference_number}\n\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 MESSAGE:

${message.message_body}

${message.metadata?.fine_amount ? `\n⚠️ PAYMENT REQUIRED:\nAmount: $${message.metadata.fine_amount} ${message.metadata.currency || 'USD'}${message.metadata.due_date ? `\nDue Date: ${new Date(message.metadata.due_date).toLocaleDateString()}` : ''}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✉️ Sent via KIVRO Inbox
🌍 Connecting Africa Digitally | www.kivro.africa

${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    `.trim();
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      toast({
        title: "✅ Copied to Clipboard",
        description: "Professional KIVRO message format copied. Paste anywhere to share!",
        duration: 4000
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
    toast({
      title: "Opening WhatsApp",
      description: "Message ready to share on WhatsApp"
    });
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`KIVRO: ${message.subject}`);
    const body = encodeURIComponent(generateShareText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    toast({
      title: "Opening Email",
      description: "Message ready to share via email"
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `KIVRO: ${message.subject}`,
          text: generateShareText(),
        });
        toast({
          title: "✅ Message Shared",
          description: "KIVRO message shared successfully"
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
        }
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Share2 className="h-6 w-6 text-green-600" />
            Share Message
          </DialogTitle>
          <DialogDescription>
            Share this KIVRO message with professional formatting
          </DialogDescription>
        </DialogHeader>

        {/* Message Preview */}
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-4 text-center">
            <p className="text-sm font-medium mb-1">📬 KIVRO INBOX MESSAGE</p>
            <p className="text-xs opacity-90">Digital Address & Communication</p>
          </div>

          {/* Message Content Preview */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{priorityEmoji}</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-semibold">SUBJECT</p>
                  <p className="font-semibold text-gray-900">{message.subject}</p>
                </div>
                <Badge variant="outline" className={getPriorityColor(message.priority)}>
                  {message.priority.toUpperCase()}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{senderIcon}</span>
                  <p className="text-xs text-gray-500 font-semibold">FROM</p>
                </div>
                <p className="font-medium text-gray-900">{senderName}</p>
                {senderCode && <p className="text-xs text-gray-500">Code: {senderCode}</p>}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📅</span>
                  <p className="text-xs text-gray-500 font-semibold">DATE</p>
                </div>
                <p className="text-xs text-gray-900">{formattedDate}</p>
              </div>
            </div>

            {message.reference_number && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">📋</span>
                    <p className="text-xs text-gray-500 font-semibold">REFERENCE</p>
                  </div>
                  <p className="text-sm font-mono text-gray-900">{message.reference_number}</p>
                </div>
              </>
            )}

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📄</span>
                <p className="text-xs text-gray-500 font-semibold">MESSAGE</p>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">
                {message.message_body}
              </p>
            </div>

            {message.metadata?.fine_amount && (
              <>
                <Separator />
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">⚠️</span>
                    <p className="text-xs text-red-700 font-semibold">PAYMENT REQUIRED</p>
                  </div>
                  <p className="font-bold text-red-900">
                    ${message.metadata.fine_amount} {message.metadata.currency || 'USD'}
                  </p>
                  {message.metadata.due_date && (
                    <p className="text-xs text-red-700 mt-1">
                      Due: {new Date(message.metadata.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer Preview */}
          <div className="bg-gray-100 rounded-lg p-3 text-center text-xs text-gray-600">
            <p>✉️ Sent via KIVRO Inbox</p>
            <p className="text-green-600 font-medium">🌍 Connecting Africa Digitally | www.kivro.africa</p>
          </div>

          <Separator />

          {/* Share Options */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Choose how to share:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleCopyToClipboard}
                variant="outline"
                className={`h-auto py-3 ${copied ? 'border-green-500 bg-green-50' : ''}`}
              >
                <div className="flex flex-col items-center gap-1">
                  {copied ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                  <span className="text-xs">{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </div>
              </Button>

              <Button
                onClick={handleWhatsAppShare}
                variant="outline"
                className="h-auto py-3 border-green-500 hover:bg-green-50"
              >
                <div className="flex flex-col items-center gap-1">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <span className="text-xs">Share on WhatsApp</span>
                </div>
              </Button>

              <Button
                onClick={handleEmailShare}
                variant="outline"
                className="h-auto py-3 border-blue-500 hover:bg-blue-50"
              >
                <div className="flex flex-col items-center gap-1">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="text-xs">Share via Email</span>
                </div>
              </Button>

              {navigator.share && (
                <Button
                  onClick={handleNativeShare}
                  variant="outline"
                  className="h-auto py-3 border-purple-500 hover:bg-purple-50"
                >
                  <div className="flex flex-col items-center gap-1">
                    <Share2 className="h-5 w-5 text-purple-600" />
                    <span className="text-xs">More Options</span>
                  </div>
                </Button>
              )}
            </div>
          </div>

          <Button onClick={onClose} variant="outline" className="w-full">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareMessageModal;
