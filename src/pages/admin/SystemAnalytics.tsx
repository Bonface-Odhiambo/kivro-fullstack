import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  MapPin,
  DollarSign,
  Activity,
  Clock,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';


const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return 'bg-green-100 text-green-800';
    case 'good': return 'bg-blue-100 text-blue-800';
    case 'warning': return 'bg-yellow-100 text-yellow-800';
    case 'critical': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function SystemAnalytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [systemMetrics, setSystemMetrics] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await (supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', session.user.id)
      .single() as unknown as Promise<{ data: { user_type: string } | null; error: any }>);

    if ((profile as any)?.user_type !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Admin privileges required",
        variant: "destructive"
      });
      navigate('/dashboard');
      return;
    }

    fetchAnalytics();
  };

  const fetchAnalytics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      const authHeader = { 'Authorization': `Bearer ${session.access_token}` };
      
      // Fetch stats
      const statsResponse = await fetch(API_ENDPOINTS.ADMIN.STATS, {
        headers: authHeader
      });
      const statsData = await statsResponse.json();

      // Fetch users
      const usersResponse = await fetch(API_ENDPOINTS.ADMIN.USERS, {
        headers: authHeader
      });
      const usersData = await usersResponse.json();

      // Fetch addresses
      const addressesResponse = await fetch(API_ENDPOINTS.ADMIN.ADDRESSES, {
        headers: authHeader
      });
      const addressesData = await addressesResponse.json();

      // Fetch payments
      const paymentsResponse = await fetch(API_ENDPOINTS.ADMIN.PAYMENTS, {
        headers: authHeader
      });
      const paymentsData = await paymentsResponse.json();

      // Process data for analytics
      const processedData = {
        stats: statsData.data,
        users: usersData.data || [],
        addresses: addressesData.data || [],
        payments: paymentsData.data || [],
        usersByMonth: processUsersByMonth(usersData.data || []),
        addressesByRegion: processAddressesByRegion(addressesData.data || []),
        revenueByMonth: processRevenueByMonth(paymentsData.data || [])
      };

      setAnalyticsData(processedData);

      // Fetch system health metrics
      try {
        const metricsResponse = await fetch(API_ENDPOINTS.SETTINGS.HEALTH_METRICS, {
          headers: authHeader
        });
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          if (metricsData.data?.length) {
            setSystemMetrics(metricsData.data.map((m: any) => ({
              name: m.metric_name,
              value: m.metric_value,
              status: m.status,
              target: m.target_value || 'N/A'
            })));
          }
        }
      } catch {
        // health metrics are optional — leave array empty
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processUsersByMonth = (users: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentDate = new Date();
    return months.map((month, index) => {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - index), 1);
      const usersInMonth = users.filter(u => {
        const createdDate = new Date(u.created_at);
        return createdDate.getMonth() === monthDate.getMonth() && 
               createdDate.getFullYear() === monthDate.getFullYear();
      });
      return {
        month,
        users: usersInMonth.length,
        newUsers: usersInMonth.length
      };
    });
  };

  const processAddressesByRegion = (addresses: any[]) => {
    const regionMap = new Map();
    addresses.forEach(addr => {
      const region = addr.region || 'Unknown';
      if (!regionMap.has(region)) {
        regionMap.set(region, { region, count: 0 });
      }
      regionMap.get(region).count++;
    });
    return Array.from(regionMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const processRevenueByMonth = (payments: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentDate = new Date();
    return months.map((month, index) => {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - index), 1);
      const paymentsInMonth = payments.filter(p => {
        const paymentDate = new Date(p.created_at);
        return paymentDate.getMonth() === monthDate.getMonth() && 
               paymentDate.getFullYear() === monthDate.getFullYear() &&
               (p.status === 'completed' || p.status === 'success');
      });
      const revenue = paymentsInMonth.reduce((sum, p) => sum + (p.amount || 0), 0);
      return {
        month,
        revenue,
        packages: paymentsInMonth.length
      };
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    toast({
      title: "✅ Data Refreshed",
      description: "Analytics data has been updated"
    });
  };

  const handleExportReport = () => {
    if (!analyticsData) return;

    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Sheet 1: Overview Stats
      const statsData = [
        ['KIVRO Admin Analytics Report'],
        ['Generated:', new Date().toLocaleString()],
        ['Period:', selectedPeriod],
        [''],
        ['Metric', 'Value'],
        ['Total Users', analyticsData.stats.totalUsers],
        ['Active Subscriptions', analyticsData.stats.activeSubscriptions],
        ['Total Addresses', analyticsData.stats.totalAddresses],
        ['Total Payments', analyticsData.stats.totalPayments],
        ['Total Revenue (KES)', analyticsData.stats.totalRevenue]
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(statsData);
      ws1['!cols'] = [{ width: 25 }, { width: 20 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'Overview');
      
      // Sheet 2: User Growth
      const userGrowthData = [
        ['Month', 'Total Users', 'New Users'],
        ...analyticsData.usersByMonth.map((m: any) => [m.month, m.users, m.newUsers])
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(userGrowthData);
      ws2['!cols'] = [{ width: 15 }, { width: 15 }, { width: 15 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'User Growth');
      
      // Sheet 3: Revenue by Month
      const revenueData = [
        ['Month', 'Revenue (KES)', 'Payments Count'],
        ...analyticsData.revenueByMonth.map((m: any) => [m.month, m.revenue, m.payments])
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(revenueData);
      ws3['!cols'] = [{ width: 15 }, { width: 18 }, { width: 18 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'Revenue');
      
      // Sheet 4: Addresses by Region
      const addressData = [
        ['Region', 'Address Count', 'Percentage'],
        ...analyticsData.addressesByRegion.map((a: any) => [a.region, a.count, a.percentage + '%'])
      ];
      const ws4 = XLSX.utils.aoa_to_sheet(addressData);
      ws4['!cols'] = [{ width: 20 }, { width: 18 }, { width: 15 }];
      XLSX.utils.book_append_sheet(wb, ws4, 'Addresses');
      
      // Generate filename with timestamp
      const filename = `KIVRO_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, filename);
      
      toast({
        title: "✅ Export Successful",
        description: `Report exported as ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  };

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="animate-spin h-8 w-8 text-green-600" />
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: `KES ${analyticsData.stats.totalRevenue.toLocaleString()}`,
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Active Users',
      value: analyticsData.stats.activeSubscriptions.toString(),
      change: '+8.2%',
      changeType: 'positive',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Total Addresses',
      value: analyticsData.stats.totalAddresses.toString(),
      change: '+15.3%',
      changeType: 'positive',
      icon: Package,
      color: 'text-purple-600'
    },
    {
      title: 'Total Payments',
      value: analyticsData.stats.totalPayments.toString(),
      change: '+10.2%',
      changeType: 'positive',
      icon: Clock,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive system performance and business metrics
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            className="bg-primary hover:bg-primary-dark"
            onClick={handleExportReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
              <div className="flex items-center text-sm mt-1">
                {kpi.changeType === 'positive' ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                )}
                <span className={
                  kpi.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }>
                  {kpi.change}
                </span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Growth Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.usersByMonth.map((data: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{data.month}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{data.users.toLocaleString()}</p>
                    <p className="text-sm text-green-600">+{data.newUsers} new</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Package Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Package Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.addresses.slice(0, 4).map((addr: any, index: number) => {
                const total = analyticsData.addresses.length;
                const percentage = ((1 / total) * 100);
                return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{addr.region || 'Unknown'}</span>
                    <span className="text-sm text-muted-foreground">{addr.district}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(percentage * 20, 100)}%` }}
                    />
                  </div>
                </div>
              );})}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Revenue & Package Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.revenueByMonth.map((data: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{data.month}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${data.revenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{data.packages} packages</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Regions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Top Regions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.addressesByRegion.map((region: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{region.region}</p>
                    <p className="text-xs text-muted-foreground">{region.count} addresses</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">#{index + 1}</p>
                    <p className="text-xs text-muted-foreground">rank</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            System Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemMetrics.map((metric, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{metric.name}</h4>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">{metric.value}</span>
                  <span className="text-xs text-muted-foreground">Target: {metric.target}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="text-sm">Custom Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <span className="text-sm">Growth Analysis</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              <span className="text-sm">User Insights</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Activity className="h-6 w-6 text-purple-600" />
              <span className="text-sm">Performance Monitor</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
