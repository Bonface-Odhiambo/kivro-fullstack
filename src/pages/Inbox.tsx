import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { InboxSkeleton } from '@/components/PageSkeleton';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Mail,
  MailOpen,
  Building2,
  RefreshCw,
  Star,
  Archive,
  Trash2,
  Download,
  Printer,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Search,
  Filter,
  MoreVertical,
  Share2,
  FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ShareMessageModal from '@/components/ShareMessageModal';
import PDFPreviewModal from '@/components/PDFPreviewModal';
import { ModernPDFGenerator } from '@/utils/modernPDFGenerator';

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
  category?: {
    name: string;
    icon: string;
    color: string;
  };
}

interface Sender {
  id: string;
  name: string;
  code: string;
  logo_url?: string;
  message_count: number;
  unread_count: number;
  last_message_at: string;
  type: 'government' | 'company';
}

export default function Inbox() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'received' | 'senders'>('received');
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'starred'>('all');
  const [shareModalMessage, setShareModalMessage] = useState<InboxMessage | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Real-time subscription: update inbox when new messages arrive via Supabase Realtime
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      channel = supabase
        .channel('inbox-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_inbox',
            filter: `recipient_user_id=eq.${session.user.id}`,
          },
          (payload) => {
            // Prepend the new message to the list without a full reload
            setMessages(prev => [payload.new as InboxMessage, ...prev]);
            toast({
              title: '📬 New message',
              description: (payload.new as InboxMessage).subject || 'You have a new message',
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_inbox',
            filter: `recipient_user_id=eq.${session.user.id}`,
          },
          (payload) => {
            setMessages(prev =>
              prev.map(m => m.id === (payload.new as InboxMessage).id ? (payload.new as InboxMessage) : m)
            );
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    fetchMessages();
    fetchSenders();
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/inbox?limit=100`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data.messages || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSenders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/inbox/senders`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSenders(data.data.senders || []);
      }
    } catch (error) {
    }
  };

  const handleMessageClick = async (message: InboxMessage) => {
    // Mark as read if not already
    if (!message.is_read) {
      await markAsRead(message.id);
    }
    
    // Navigate to message detail page
    navigate(`/dashboard/inbox/${message.id}`);
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/inbox/${messageId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, is_read: true } : m)
      );
    } catch (error) {
    }
  };

  const toggleStar = async (messageId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/inbox/${messageId}/star`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, is_starred: !m.is_starred } : m)
      );

      toast({
        title: messages.find(m => m.id === messageId)?.is_starred ? "Unstarred" : "Starred",
        description: "Message updated successfully"
      });
    } catch (error) {
    }
  };

  const archiveMessage = async (messageId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/inbox/${messageId}/archive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      setMessages(prev => prev.filter(m => m.id !== messageId));
      setSelectedMessage(null);

      toast({
        title: "Archived",
        description: "Message archived successfully"
      });
    } catch (error) {
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/inbox/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      setMessages(prev => prev.filter(m => m.id !== messageId));
      setSelectedMessage(null);

      toast({
        title: "Deleted",
        description: "Message deleted successfully"
      });
    } catch (error) {
    }
  };

  const generatePDF = async (message: InboxMessage) => {
    try {
      // Show loading toast
      toast({
        title: "🔄 Generating PDF...",
        description: "Creating your modern document with KIVRO branding."
      });

      // Create modern PDF generator
      const pdfGenerator = new ModernPDFGenerator();
      
      // Generate modern PDF
      const blob = await pdfGenerator.generateMessagePDF(message);
      const fileName = pdfGenerator.getFileName(message);

      // Set PDF preview data and open modal
      setPdfPreviewBlob(blob);
      setPdfFileName(fileName);
      setShowPdfPreview(true);

      toast({
        title: "✅ PDF Ready for Preview",
        description: "Your modern document is ready. Review it before downloading."
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "PDF Generation Failed",
        description: `Could not generate PDF: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const downloadMessage = (message: InboxMessage) => {
    const senderName = message.sender_type === 'company' 
      ? (message.company_sender?.company_name || 'Company') 
      : (message.sender?.organization_name || 'Government Agency');

    const content = `
KIVRO INBOX MESSAGE
${'='.repeat(60)}

Subject: ${message.subject}
From: ${senderName}
Date: ${new Date(message.sent_at).toLocaleString()}
Reference: ${message.reference_number || 'N/A'}
Priority: ${message.priority.toUpperCase()}

${'='.repeat(60)}

${message.message_body}

${'='.repeat(60)}
Downloaded from KIVRO on ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KIVRO_Message_${message.reference_number || message.id}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Message downloaded successfully"
    });
  };

  const printMessage = (message: InboxMessage) => {
    window.print();
  };

  const shareMessage = (message: InboxMessage) => {
    setShareModalMessage(message);
  };

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

  const getMessageIcon = (message: InboxMessage) => {
    if (message.metadata?.fine_amount) return '💰';
    if (message.priority === 'urgent') return '🚨';
    if (message.message_type === 'invoice') return '📄';
    if (message.message_type === 'notification') return '📬';
    return '📧';
  };

  const filteredMessages = messages.filter(m => {
    if (filterType === 'unread' && m.is_read) return false;
    if (filterType === 'starred' && !m.is_starred) return false;
    if (searchTerm && !m.subject.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !m.message_body.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="bg-white min-h-screen">
      {/* Header with Tabs */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Inbox</h1>
        
        {/* Tabs on the right */}
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors flex-1 sm:flex-initial ${
              activeTab === 'received'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Received
          </button>
          <button
            onClick={() => setActiveTab('senders')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors flex-1 sm:flex-initial ${
              activeTab === 'senders'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            My Senders
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500 text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Messages List */}
      {activeTab === 'received' && (
        <div className="px-4 sm:px-6">
          {loading ? (
            <InboxSkeleton />
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Mail className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No messages found</h3>
              <p className="text-gray-500">Your inbox is empty</p>
            </div>
          ) : (
            <div className="space-y-0">
              {/* Month Header */}
              <div className="pt-6 pb-3">
                <h2 className="text-base font-semibold text-gray-900">November 2025</h2>
              </div>

              {/* Messages */}
              {filteredMessages.map((message) => {
                const senderName = message.sender_type === 'company' 
                  ? (message.company_sender?.company_name || 'Company') 
                  : (message.sender?.organization_name || 'Government Agency');

                const messageDate = new Date(message.sent_at);
                const isOverdue = message.metadata?.due_date && new Date(message.metadata.due_date) < new Date();

                return (
                  <div
                    key={message.id}
                    className="flex items-center justify-between py-3 sm:py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleMessageClick(message)}
                  >
                    {/* Left side - Sender info */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                          {senderName}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                          {message.sender_type === 'company' ? 'Company' : 'Telecommunication'}
                        </p>
                      </div>
                    </div>

                    {/* Right side - Date and amount */}
                    <div className="flex items-center gap-2 sm:gap-6 text-right flex-shrink-0">
                      {/* Due date badge - hidden on mobile */}
                      {message.metadata?.due_date && (
                        <div className={`hidden sm:block px-2 py-1 rounded text-xs font-medium ${
                          isOverdue 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          Due on {new Date(message.metadata.due_date).toLocaleDateString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: '2-digit'
                          })}
                        </div>
                      )}

                      {/* Amount and Date */}
                      <div className="text-right min-w-[60px] sm:min-w-[100px]">
                        {message.metadata?.fine_amount && (
                          <div className="font-semibold text-gray-900 text-xs sm:text-sm">
                            SEK {message.metadata.fine_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-0.5">
                          {messageDate.getDate()} {messageDate.toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="text-gray-400">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* My Senders Tab */}
      {activeTab === 'senders' && (
        <div className="px-4 sm:px-6">
          {/* Senders Heading */}
          <div className="pt-6 pb-4">
            <h2 className="text-base font-semibold text-gray-900">Senders</h2>
          </div>

          {senders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No senders yet</h3>
              <p className="text-gray-500">You haven't received any messages</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 pb-6">
              {senders.map((sender) => (
                <div
                  key={sender.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => {
                    setSearchTerm(sender.name);
                    setActiveTab('received');
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Logo/Icon */}
                    <div className="w-16 h-16 mb-4 flex items-center justify-center">
                      {sender.logo_url ? (
                        <img 
                          src={sender.logo_url} 
                          alt={sender.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Hide broken image and show fallback icon
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) (fallback as HTMLElement).style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center"
                        style={{ display: sender.logo_url ? 'none' : 'flex' }}
                      >
                        <Building2 className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    
                    {/* Sender Name */}
                    <h3 className="font-medium text-sm text-gray-900 truncate w-full">
                      {sender.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Share Message Modal */}
      <ShareMessageModal
        isOpen={!!shareModalMessage}
        onClose={() => setShareModalMessage(null)}
        message={shareModalMessage}
      />

      {/* Message Detail Modal */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {selectedMessage && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-lg sm:text-2xl mb-2">{selectedMessage.subject}</DialogTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={getPriorityColor(selectedMessage.priority)}>
                        {selectedMessage.priority.toUpperCase()}
                      </Badge>
                      {selectedMessage.reference_number && (
                        <Badge variant="outline" className="bg-gray-100">
                          Ref: {selectedMessage.reference_number}
                        </Badge>
                      )}
                      {selectedMessage.category && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          {selectedMessage.category.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Action Buttons - Top of Modal */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => generatePDF(selectedMessage)}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-md border-0 font-semibold"
                      size="sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download Official PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => printMessage(selectedMessage)}
                      className="border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                      size="sm"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => shareMessage(selectedMessage)}
                      className="border-purple-300 hover:bg-purple-50 hover:border-purple-400"
                      size="sm"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => toggleStar(selectedMessage.id)}
                      className={`${
                        selectedMessage.is_starred 
                          ? 'border-yellow-400 bg-yellow-50 hover:bg-yellow-100' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      size="sm"
                    >
                      <Star className={`h-4 w-4 mr-2 ${selectedMessage.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      {selectedMessage.is_starred ? 'Starred' : 'Star'}
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => archiveMessage(selectedMessage.id)}
                      className="border-gray-300 hover:bg-gray-50"
                      size="sm"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sender Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center text-2xl">
                    {selectedMessage.sender_type === 'government' ? '🏛️' : '🏢'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {selectedMessage.sender_type === 'company' 
                        ? (selectedMessage.company_sender?.company_name || 'Company') 
                        : (selectedMessage.sender?.organization_name || 'Government Agency')}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {selectedMessage.sender_type === 'company' 
                        ? selectedMessage.company_sender?.company_code 
                        : selectedMessage.sender?.organization_code}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(selectedMessage.sent_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-4 w-4" />
                      {new Date(selectedMessage.sent_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {selectedMessage.message_body}
                </div>
              </div>

              {/* Payment Info */}
              {selectedMessage.metadata?.fine_amount && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-2">Payment Required</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-red-700">Amount:</span>
                          <p className="font-bold text-lg text-red-900">
                            ${selectedMessage.metadata.fine_amount} {selectedMessage.metadata.currency || 'USD'}
                          </p>
                        </div>
                        {selectedMessage.metadata.due_date && (
                          <div>
                            <span className="text-red-700">Due Date:</span>
                            <p className="font-semibold text-red-900">
                              {new Date(selectedMessage.metadata.due_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        pdfBlob={pdfPreviewBlob}
        fileName={pdfFileName}
      />

      {/* Share Message Modal */}
      <ShareMessageModal
        message={shareModalMessage}
        isOpen={!!shareModalMessage}
        onClose={() => setShareModalMessage(null)}
      />
    </div>
  );
}
