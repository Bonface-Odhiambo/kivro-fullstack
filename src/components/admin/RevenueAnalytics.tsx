import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard,
  Calendar,
  Download
} from 'lucide-react';

interface RevenueData {
  month: string;
  revenue: number;
  subscriptions: number;
  enterprise: number;
  business: number;
  personal: number;
}

interface RevenueStats {
  totalRevenue: number;
  monthlyGrowth: number;
  activeSubscriptions: number;
  averageRevenuePerUser: number;
  enterpriseRevenue: number;
  businessRevenue: number;
  personalRevenue: number;
}

const mockRevenueData: RevenueData[] = [
  { month: 'Jan', revenue: 12500, subscriptions: 1250, enterprise: 8400, business: 3200, personal: 900 },
  { month: 'Feb', revenue: 15200, subscriptions: 1520, enterprise: 10080, business: 4104, personal: 1016 },
  { month: 'Mar', revenue: 18900, subscriptions: 1890, enterprise: 12474, business: 5103, personal: 1323 },
  { month: 'Apr', revenue: 22100, subscriptions: 2210, enterprise: 14586, business: 5968, personal: 1546 },
  { month: 'May', revenue: 26800, subscriptions: 2680, enterprise: 17684, business: 7244, personal: 1872 },
  { month: 'Jun', revenue: 31200, subscriptions: 3120, enterprise: 20592, business: 8424, personal: 2184 },
];

const mockStats: RevenueStats = {
  totalRevenue: 126700,
  monthlyGrowth: 18.5,
  activeSubscriptions: 3120,
  averageRevenuePerUser: 40.61,
  enterpriseRevenue: 83816,
  businessRevenue: 34043,
  personalRevenue: 8841
};

const planColors = {
  enterprise: '#8B5CF6',
  business: '#3B82F6', 
  personal: '#10B981'
};

const RevenueAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('6months');
  const [stats, setStats] = useState<RevenueStats>(mockStats);
  const [revenueData, setRevenueData] = useState<RevenueData[]>(mockRevenueData);
  const [loading, setLoading] = useState(true);

  const fetchRevenueData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "Please log in to view revenue analytics",
          variant: "destructive",
        });
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/revenue`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setStats(result.data.stats);
          setRevenueData(result.data.revenueData.length > 0 ? result.data.revenueData : mockRevenueData);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch revenue data. Using sample data.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch revenue data. Using sample data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  const pieData = [
    { name: 'Enterprise ($24/year)', value: stats.enterpriseRevenue, color: planColors.enterprise },
    { name: 'Business ($120/year)', value: stats.businessRevenue, color: planColors.business },
    { name: 'Personal (Free)', value: stats.personalRevenue, color: planColors.personal }
  ];

  const handleExportData = () => {
    const csvContent = [
      ['Month', 'Total Revenue', 'Subscriptions', 'Enterprise', 'Business', 'Personal'],
      ...revenueData.map(row => [
        row.month,
        row.revenue,
        row.subscriptions,
        row.enterprise,
        row.business,
        row.personal
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kivro-revenue-${timeRange}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading revenue analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Revenue Analytics</h2>
          <p className="text-muted-foreground">Track revenue performance and subscription metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Revenue Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{stats.monthlyGrowth}%
              </Badge>
              <span className="ml-2">from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Paying customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARPU</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.averageRevenuePerUser.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Average Revenue Per User
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enterprise Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.enterpriseRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              66% of total revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Growth */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Growth by Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="enterprise" stackId="a" fill={planColors.enterprise} name="Enterprise" />
              <Bar dataKey="business" stackId="a" fill={planColors.business} name="Business" />
              <Bar dataKey="personal" stackId="a" fill={planColors.personal} name="Personal" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Month</th>
                  <th className="text-right p-2">Total Revenue</th>
                  <th className="text-right p-2">Enterprise</th>
                  <th className="text-right p-2">Business</th>
                  <th className="text-right p-2">Personal</th>
                  <th className="text-right p-2">Subscriptions</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-medium">{row.month}</td>
                    <td className="p-2 text-right">${row.revenue.toLocaleString()}</td>
                    <td className="p-2 text-right">${row.enterprise.toLocaleString()}</td>
                    <td className="p-2 text-right">${row.business.toLocaleString()}</td>
                    <td className="p-2 text-right">${row.personal.toLocaleString()}</td>
                    <td className="p-2 text-right">{row.subscriptions.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueAnalytics;
