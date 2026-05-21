import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ChevronLeft,
  Printer,
  Download,
  Trash2
} from 'lucide-react';

interface InboxMessage {
  id: string;
  subject: string;
  message_content: string;
  message_type: string;
  priority: string;
  status: string;
  payment_required: boolean;
  payment_amount?: number;
  payment_due_date?: string;
  reference_number: string;
  created_at: string;
  sender_id: string;
  message_senders?: {
    name: string;
    organization: string;
    sender_type: string;
    logo_url?: string;
    email?: string;
    phone?: string;
  };
}

export default function ReceiptDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [message, setMessage] = useState<InboxMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    fetchUserProfile(session.user.id);
    fetchMessage();
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, full_name')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
    }
  };

  const fetchMessage = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('inbox_messages')
        .select(`
          *,
          message_senders (
            name,
            organization,
            sender_type,
            logo_url,
            email,
            phone
          )
        `)
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;
      setMessage(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load receipt details",
        variant: "destructive"
      });
      navigate('/receipts');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: "Receipt is being downloaded as PDF"
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this receipt?')) return;

    try {
      const { error } = await supabase
        .from('inbox_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Receipt Deleted",
        description: "Receipt has been permanently deleted"
      });
      navigate('/receipts');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete receipt",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Receipt not found</p>
      </div>
    );
  }

  const senderName = message.message_senders?.name || message.message_senders?.organization || 'Unknown Sender';
  const displayName = userProfile?.display_name || userProfile?.full_name || 'User';
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => navigate('/dashboard/receipts')}
            className="hover:text-gray-900 flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Receipt
          </button>
          <span>&gt;</span>
          <span>{senderName}</span>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Receipt {message.reference_number}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Receipt Details */}
          <div className="lg:col-span-2">
            <Card className="bg-white">
              <CardContent className="p-8">
                {/* Sender Header */}
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{senderName}</h1>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="font-medium">Business Number: {message.reference_number}</p>
                      {message.message_senders?.organization && (
                        <p>{message.message_senders.organization}</p>
                      )}
                      {message.message_senders?.phone && (
                        <p>{message.message_senders.phone}</p>
                      )}
                      {message.message_senders?.email && (
                        <p>{message.message_senders.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 uppercase mb-1">{senderName}</p>
                    <p className="text-sm font-medium">INV0001</p>
                    <p className="text-sm text-gray-500 mt-4">DATE</p>
                    <p className="text-sm font-medium">
                      {new Date(message.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-500 mt-4">DUE</p>
                    <p className="text-sm font-medium">
                      {message.payment_due_date 
                        ? new Date(message.payment_due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'On Receipt'}
                    </p>
                    {message.payment_amount && (
                      <>
                        <p className="text-sm text-gray-500 mt-4">BALANCE DUE</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${message.payment_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Bill To Section */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Bill To</h3>
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">{displayName}</p>
                    <p className="text-gray-600 mt-2">
                      {/* User address would go here if available */}
                      Address information
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border-t border-b border-gray-200 py-4">
                  <div className="grid grid-cols-12 gap-4 mb-3">
                    <div className="col-span-6 text-sm font-semibold text-gray-500 uppercase">
                      Description
                    </div>
                    <div className="col-span-2 text-sm font-semibold text-gray-500 uppercase text-right">
                      Rate
                    </div>
                    <div className="col-span-2 text-sm font-semibold text-gray-500 uppercase text-right">
                      Qty
                    </div>
                    <div className="col-span-2 text-sm font-semibold text-gray-500 uppercase text-right">
                      Amount
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 py-3">
                    <div className="col-span-6 text-sm text-gray-900">
                      {message.subject}
                    </div>
                    <div className="col-span-2 text-sm text-gray-900 text-right">
                      ${message.payment_amount ? (message.payment_amount / 1).toFixed(2) : '0.00'}
                    </div>
                    <div className="col-span-2 text-sm text-gray-900 text-right">
                      1
                    </div>
                    <div className="col-span-2 text-sm text-gray-900 text-right">
                      ${message.payment_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-6 flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between py-2 border-t border-gray-200">
                      <span className="text-sm font-semibold text-gray-900">Total</span>
                      <span className="text-sm font-bold text-gray-900">
                        ${message.payment_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Receipt Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Receipt</h2>
                
                <div className="mb-6">
                  <p className="text-3xl font-bold text-gray-900 mb-4">
                    ${message.payment_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <span className="text-xl">📱</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Doz Apotex</p>
                      <p className="text-xs text-gray-500">Telecommunication</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Received</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(message.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
