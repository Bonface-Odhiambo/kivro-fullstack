import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  RefreshCw,
  XCircle
} from 'lucide-react';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800';
    case 'completed': return 'bg-blue-100 text-blue-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'under_review': return 'bg-orange-100 text-orange-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved': return <CheckCircle className="h-3 w-3" />;
    case 'completed': return <CheckCircle className="h-3 w-3" />;
    case 'pending': return <Clock className="h-3 w-3" />;
    case 'under_review': return <AlertTriangle className="h-3 w-3" />;
    case 'rejected': return <XCircle className="h-3 w-3" />;
    default: return <Clock className="h-3 w-3" />;
  }
};

export default function GovernmentServices() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [applications, setApplications] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newService, setNewService] = useState({
    service_name: '',
    department_id: '',
    description: '',
    processing_time: '',
    fee_amount: '',
    requirements: ''
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', session.user.id)
      .single();

    if (profile?.user_type !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Admin privileges required",
        variant: "destructive"
      });
      navigate('/dashboard');
      return;
    }

    fetchGovernmentData();
  };

  const fetchGovernmentData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      const authHeader = { 'Authorization': `Bearer ${session.access_token}` };
      
      // Fetch applications
      const appsRes = await fetch(API_ENDPOINTS.GOVERNMENT.APPLICATIONS, { headers: authHeader });
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData.data || []);
      }
      
      // Fetch departments
      const deptRes = await fetch(API_ENDPOINTS.GOVERNMENT.DEPARTMENTS, { headers: authHeader });
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData.data || []);
      }

      // Fetch services
      const servicesRes = await fetch(API_ENDPOINTS.GOVERNMENT.SERVICES, { headers: authHeader });
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData.data || []);
      }
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleCreateService = async () => {
    if (!newService.service_name || !newService.department_id) {
      toast({
        title: "Validation Error",
        description: "Service name and department are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(API_ENDPOINTS.GOVERNMENT.SERVICES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...newService,
          fee_amount: parseFloat(newService.fee_amount) || 0,
          requirements: newService.requirements ? newService.requirements.split(',').map(r => r.trim()) : []
        })
      });

      if (response.ok) {
        toast({
          title: "✅ Service Created",
          description: "New service added successfully",
        });
        setShowCreateModal(false);
        setNewService({
          service_name: '',
          department_id: '',
          description: '',
          processing_time: '',
          fee_amount: '',
          requirements: ''
        });
        fetchGovernmentData();
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to Create Service",
          description: errorData.message || "An error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create service",
        variant: "destructive"
      });
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.application_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.service?.service_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { 
      label: 'Total Applications', 
      value: applications.length, 
      color: 'text-primary',
      icon: FileText
    },
    { 
      label: 'Pending', 
      value: applications.filter(a => a.status === 'pending').length, 
      color: 'text-yellow-600',
      icon: Clock
    },
    { 
      label: 'Approved', 
      value: applications.filter(a => a.status === 'approved').length, 
      color: 'text-green-600',
      icon: CheckCircle
    },
    { 
      label: 'Total Services', 
      value: services.length, 
      color: 'text-blue-600',
      icon: Building2
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Government Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage government service applications and requests
          </p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary-dark"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Service
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Service Applications
          </CardTitle>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
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
                <TableHead>Application ID</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="animate-spin h-6 w-6 mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm">{app.application_id}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm font-medium">{app.service?.service_name || 'N/A'}</span>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{app.applicant_name}</p>
                        <p className="text-xs text-muted-foreground">{app.applicant_phone}</p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm">{app.service?.department?.name || 'N/A'}</span>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getStatusColor(app.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(app.status)}
                          {app.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-medium">${app.fee_amount || 0}</span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{new Date(app.submitted_at).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Service Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Service</DialogTitle>
            <DialogDescription>
              Add a new government service to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="service_name">Service Name *</Label>
              <Input
                id="service_name"
                placeholder="e.g., Passport Application"
                value={newService.service_name}
                onChange={(e) => setNewService({...newService, service_name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="department_id">Department *</Label>
              <select
                id="department_id"
                value={newService.department_id}
                onChange={(e) => setNewService({...newService, department_id: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Service description"
                value={newService.description}
                onChange={(e) => setNewService({...newService, description: e.target.value})}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="processing_time">Processing Time</Label>
              <Input
                id="processing_time"
                placeholder="e.g., 5-7 business days"
                value={newService.processing_time}
                onChange={(e) => setNewService({...newService, processing_time: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="fee_amount">Fee Amount (USD)</Label>
              <Input
                id="fee_amount"
                type="number"
                placeholder="0.00"
                value={newService.fee_amount}
                onChange={(e) => setNewService({...newService, fee_amount: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="requirements">Requirements (comma-separated)</Label>
              <Textarea
                id="requirements"
                placeholder="e.g., ID Card, Birth Certificate, Proof of Address"
                value={newService.requirements}
                onChange={(e) => setNewService({...newService, requirements: e.target.value})}
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateService}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
