import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { API_ENDPOINTS } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Key,
  Eye,
  EyeOff,
  Users,
  Activity,
  Clock,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  Ban,
  CheckCircle,
  XCircle
} from 'lucide-react';


const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-red-100 text-red-800';
    case 'investigating': return 'bg-yellow-100 text-yellow-800';
    case 'resolved': return 'bg-green-100 text-green-800';
    case 'blocked': return 'bg-blue-100 text-blue-800';
    case 'valid': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical': return <ShieldAlert className="h-4 w-4 text-red-600" />;
    case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    case 'medium': return <Shield className="h-4 w-4 text-yellow-600" />;
    case 'low': return <ShieldCheck className="h-4 w-4 text-blue-600" />;
    default: return <Shield className="h-4 w-4 text-gray-600" />;
  }
};

export default function SecurityCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [systemSecurity, setSystemSecurity] = useState<any[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const authHeader = { Authorization: `Bearer ${session.access_token}` };

      const [alertsRes, blockedRes, statusRes] = await Promise.all([
        fetch(API_ENDPOINTS.SECURITY.ALERTS, { headers: authHeader }),
        fetch(API_ENDPOINTS.SECURITY.BLOCKED_IPS, { headers: authHeader }),
        fetch(API_ENDPOINTS.SECURITY.SYSTEM_STATUS, { headers: authHeader }),
      ]);

      if (alertsRes.ok) {
        const d = await alertsRes.json();
        setSecurityAlerts(d.data || []);
      }
      if (blockedRes.ok) {
        const d = await blockedRes.json();
        setBlockedIPs(d.data || []);
      }
      if (statusRes.ok) {
        const d = await statusRes.json();
        setSystemSecurity(d.data || []);
      }
    } catch {
      // silent — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSecurityData(); }, [fetchSecurityData]);

  const filteredAlerts = securityAlerts.filter(alert => {
    const matchesSearch = (alert.title ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (alert.description ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(alert.id ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || alert.status === selectedStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const securityStats = [
    { 
      label: 'Active Threats', 
      value: securityAlerts.filter(a => a.status === 'active').length, 
      color: 'text-red-600',
      icon: ShieldAlert
    },
    { 
      label: 'Blocked IPs', 
      value: blockedIPs.length, 
      color: 'text-orange-600',
      icon: Ban
    },
    { 
      label: 'Resolved Issues', 
      value: securityAlerts.filter(a => a.status === 'resolved').length, 
      color: 'text-green-600',
      icon: CheckCircle
    },
    { 
      label: 'System Health', 
      value: '98.5%', 
      color: 'text-blue-600',
      icon: ShieldCheck
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Security Center</h1>
          <p className="text-muted-foreground mt-1">
            Monitor security threats and system protection status
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSecurityData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            <ShieldAlert className="h-4 w-4 mr-2" />
            Emergency Lockdown
          </Button>
        </div>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {securityStats.map((stat, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Security Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              System Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemSecurity.map((system, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      system.status === 'active' || system.status === 'valid' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{system.name}</p>
                      <p className="text-xs text-muted-foreground">Updated: {system.lastUpdated}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(system.status)}>
                    {system.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Blocked IPs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-primary" />
              Blocked IP Addresses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {blockedIPs.map((blockedIP, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Ban className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="font-mono text-sm font-medium">{blockedIP.ip}</p>
                      <p className="text-xs text-muted-foreground">{blockedIP.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">{blockedIP.attempts} attempts</p>
                    <p className="text-xs text-muted-foreground">{blockedIP.blockedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Security Alerts
          </CardTitle>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="blocked">Blocked</option>
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alert ID</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(alert.severity)}
                      <span className="font-mono text-sm">{alert.id}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-mono">{alert.ipAddress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{alert.location}</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getStatusColor(alert.status)}>
                      {alert.status}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{alert.timestamp}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Ban className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Security Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Security Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Lock className="h-6 w-6 text-primary" />
              <span className="text-sm">System Lockdown</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Key className="h-6 w-6 text-blue-600" />
              <span className="text-sm">Reset Passwords</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Ban className="h-6 w-6 text-red-600" />
              <span className="text-sm">Block IP Range</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="h-6 w-6 text-orange-600" />
              <span className="text-sm">Audit Users</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
