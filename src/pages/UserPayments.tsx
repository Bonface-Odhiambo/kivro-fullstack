import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { formatCurrency, getTenantCurrency } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  ChevronRight,
  Trash2,
  Mail,
  CheckCheck,
  Wallet
} from 'lucide-react';

interface PaymentRequest {
  id: string;
  request_number: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string;
  due_date?: string;
  paid_at?: string;
  source_type?: string;
  reference_number?: string;
  payer_name?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface Sender {
  organization_name: string;
  organization_code: string;
}

export default function UserPayments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenant } = useTenant();
  const currency = getTenantCurrency(tenant.default_language);
  const [searchTerm, setSearchTerm] = useState('');
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    fetchPayments();
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load payments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentSelection = (paymentId: string) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelectedPayments(newSelected);
  };

  const handleMarkAsHandled = async () => {
    if (selectedPayments.size === 0) {
      toast({
        title: "No payments selected",
        description: "Please select payments to mark as handled",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({ status: 'completed' })
        .in('id', Array.from(selectedPayments));

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedPayments.size} payment(s) marked as handled`
      });

      setSelectedPayments(new Set());
      fetchPayments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payments",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsRead = async () => {
    if (selectedPayments.size === 0) {
      toast({
        title: "No payments selected",
        description: "Please select payments to mark as read",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: `${selectedPayments.size} payment(s) marked as read`
    });
    setSelectedPayments(new Set());
  };

  const handleDelete = async () => {
    if (selectedPayments.size === 0) {
      toast({
        title: "No payments selected",
        description: "Please select payments to delete",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_requests')
        .delete()
        .in('id', Array.from(selectedPayments));

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedPayments.size} payment(s) deleted`
      });

      setSelectedPayments(new Set());
      fetchPayments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete payments",
        variant: "destructive"
      });
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const pendingPayments = filteredPayments.filter(p => p.status === 'pending');
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
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

      {/* Total to Pay Banner */}
      <Card className="bg-green-50 border-green-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total to pay</p>
              <p className="text-2xl font-bold text-gray-900">${totalPending.toFixed(2)}</p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Wallet className="h-4 w-4 mr-2" />
              Pay Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Due Header with Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h2 className="text-base font-medium text-gray-900">
          Payment Due ({pendingPayments.length})
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAsHandled}
            disabled={selectedPayments.size === 0}
            className="text-gray-600 hover:text-gray-900"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark as handled
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAsRead}
            disabled={selectedPayments.size === 0}
            className="text-gray-600 hover:text-gray-900"
          >
            <Mail className="h-4 w-4 mr-2" />
            Mark as read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={selectedPayments.size === 0}
            className="text-gray-600 hover:text-gray-900"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 mx-auto border-4 border-green-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-500">Loading payments...</p>
        </div>
      ) : pendingPayments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending payments</h3>
            <p className="text-gray-500">You're all caught up!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {pendingPayments.map((payment) => (
            <Card
              key={payment.id}
              className="hover:shadow-sm transition-shadow border border-gray-200"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Company Logo/Icon */}
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <span className="text-xl">📱</span>
                    </div>
                  </div>

                  {/* Company Name and Category */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{payment.title || 'Payment Request'}</h3>
                    <p className="text-sm text-gray-500">Telecommunication</p>
                  </div>

                  {/* Due Date Badge */}
                  {payment.due_date && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      Due on {new Date(payment.due_date).toLocaleDateString('en-US', { 
                        year: 'numeric',
                        month: '2-digit', 
                        day: '2-digit' 
                      })}
                    </Badge>
                  )}

                  {/* Amount */}
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${payment.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.created_at).toLocaleDateString('en-US', { 
                        day: 'numeric',
                        month: 'short'
                      })}
                    </p>
                  </div>

                  {/* Arrow Icon */}
                  <ChevronRight className="h-5 w-5 text-gray-400" />

                  {/* Checkbox */}
                  <Checkbox
                    checked={selectedPayments.has(payment.id)}
                    onCheckedChange={() => togglePaymentSelection(payment.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
