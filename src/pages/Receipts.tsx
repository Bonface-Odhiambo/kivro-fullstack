import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Search,
  ChevronRight
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
  reference_number: string;
  created_at: string;
  sender_id: string;
  message_senders?: {
    name: string;
    organization: string;
    sender_type: string;
    logo_url?: string;
  };
}

interface Sender {
  id: string;
  name: string;
  organization: string;
  sender_type: string;
  logo_url?: string;
  message_count: number;
}

export default function Receipts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAuth();
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

      const { data, error } = await supabase
        .from('inbox_messages')
        .select(`
          *,
          message_senders (
            name,
            organization,
            sender_type,
            logo_url
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
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

      // Get all messages with sender info
      const { data: messagesData, error: messagesError } = await supabase
        .from('inbox_messages')
        .select('sender_id')
        .eq('user_id', session.user.id);

      if (messagesError) throw messagesError;

      // Count messages per sender
      const senderCounts = new Map<string, number>();
      messagesData?.forEach(msg => {
        const count = senderCounts.get(msg.sender_id) || 0;
        senderCounts.set(msg.sender_id, count + 1);
      });

      // Get unique sender IDs
      const senderIds = Array.from(senderCounts.keys());

      if (senderIds.length === 0) {
        setSenders([]);
        return;
      }

      // Fetch sender details
      const { data: sendersData, error: sendersError } = await supabase
        .from('message_senders')
        .select('id, name, organization, sender_type, logo_url')
        .in('id', senderIds);

      if (sendersError) throw sendersError;

      // Combine sender data with message counts
      const sendersArray: Sender[] = (sendersData || []).map(sender => ({
        ...sender,
        message_count: senderCounts.get(sender.id) || 0
      }));

      setSenders(sendersArray);
    } catch (error) {
    }
  };

  const filteredMessages = messages.filter(message => {
    const senderName = message.message_senders?.name || message.message_senders?.organization || '';
    const matchesSearch = 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.reference_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }).slice(0, 3); // Show only latest 3 messages

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Receipts</h1>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white border-gray-200"
        />
      </div>

      {/* Latest Messages Section */}
      <div>
        <h2 className="text-base font-medium text-gray-900 mb-3">Latest</h2>
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 mx-auto border-4 border-green-600 border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-500">Loading messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500">No messages found</p>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => (
              <Card
                key={message.id}
                className="hover:shadow-sm transition-shadow border border-gray-200 cursor-pointer"
                onClick={() => navigate(`/dashboard/receipts/${message.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Sender Logo/Icon */}
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <span className="text-xl">
                          {message.message_senders?.sender_type === 'government' ? '🏛️' : 
                           message.message_senders?.sender_type === 'business' ? '🏢' :
                           message.message_senders?.sender_type === 'utility' ? '⚡' :
                           message.message_senders?.sender_type === 'legal' ? '⚖️' : '📱'}
                        </span>
                      </div>
                    </div>

                    {/* Sender Name and Type */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">
                        {message.message_senders?.name || message.message_senders?.organization || 'Unknown Sender'}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {message.message_senders?.sender_type || message.message_type}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="text-sm text-gray-500">
                      {new Date(message.created_at).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>

                    {/* Arrow Icon */}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Senders Section */}
      <div>
        <h2 className="text-base font-medium text-gray-900 mb-3">Senders</h2>
        {senders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500">No senders found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {senders.map((sender) => (
              <Card
                key={sender.id}
                className="hover:shadow-sm transition-shadow cursor-pointer border border-gray-200"
                onClick={() => {
                  // Filter to show messages from this sender
                  setSearchTerm(sender.name);
                }}
              >
                <CardContent className="p-4 flex flex-col items-center text-center">
                  {/* Sender Logo */}
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-3">
                    <span className="text-3xl">
                      {sender.sender_type === 'government' ? '🏛️' : 
                       sender.sender_type === 'business' ? '🏢' :
                       sender.sender_type === 'utility' ? '⚡' :
                       sender.sender_type === 'legal' ? '⚖️' : '📱'}
                    </span>
                  </div>
                  {/* Sender Name */}
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                    {sender.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {sender.message_count} message{sender.message_count !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
