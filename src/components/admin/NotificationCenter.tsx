import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { API_ENDPOINTS } from '@/config/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Send, 
  Users, 
  Mail, 
  MessageSquare, 
  Bell,
  Calendar,
  Filter,
  Search,
  Plus,
  Eye,
  Trash2
} from 'lucide-react';

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'email' | 'sms' | 'push';
  category: 'marketing' | 'system' | 'billing' | 'security';
  createdAt: string;
}

interface NotificationCampaign {
  id: string;
  name: string;
  template: string;
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduledFor?: string;
  createdAt: string;
}

const mockTemplates: NotificationTemplate[] = [
  {
    id: '1',
    name: 'Welcome New User',
    subject: 'Welcome to Kivro - Your Digital Address Awaits!',
    content: 'Welcome to Kivro! Your digital address system is ready to use.',
    type: 'email',
    category: 'marketing',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Address Created',
    subject: 'Your Kivro Address is Ready',
    content: 'Your new Kivro address has been successfully created: {address}',
    type: 'sms',
    category: 'system',
    createdAt: '2024-01-10'
  },
  {
    id: '3',
    name: 'Payment Reminder',
    subject: 'Subscription Payment Due',
    content: 'Your Kivro subscription payment is due in 3 days.',
    type: 'email',
    category: 'billing',
    createdAt: '2024-01-05'
  }
];

const mockCampaigns: NotificationCampaign[] = [
  {
    id: '1',
    name: 'New Feature Announcement',
    template: 'Feature Update',
    recipients: 15248,
    sent: 15248,
    opened: 8934,
    clicked: 2156,
    status: 'completed',
    createdAt: '2024-01-20'
  },
  {
    id: '2',
    name: 'Payment Reminders',
    template: 'Payment Reminder',
    recipients: 1250,
    sent: 1250,
    opened: 890,
    clicked: 234,
    status: 'completed',
    createdAt: '2024-01-18'
  },
  {
    id: '3',
    name: 'Enterprise Plan Promotion',
    template: 'Enterprise Promo',
    recipients: 5000,
    sent: 0,
    opened: 0,
    clicked: 0,
    status: 'scheduled',
    scheduledFor: '2024-01-25',
    createdAt: '2024-01-15'
  }
];

const NotificationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('send');
  const [templates, setTemplates] = useState<NotificationTemplate[]>(mockTemplates);
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>(mockCampaigns);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'email' as 'email' | 'sms' | 'push',
    category: 'marketing' as 'marketing' | 'system' | 'billing' | 'security'
  });
  const [newNotification, setNewNotification] = useState({
    type: 'email' as 'email' | 'sms' | 'push',
    audience: 'all' as 'all' | 'enterprise' | 'business' | 'free' | 'custom',
    subject: '',
    message: '',
    scheduleType: 'now' as 'now' | 'scheduled',
    scheduledDate: '',
    scheduledTime: ''
  });
  const { toast } = useToast();

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const template: NotificationTemplate = {
      id: (templates.length + 1).toString(),
      name: newTemplate.name,
      subject: newTemplate.subject,
      content: newTemplate.content,
      type: newTemplate.type,
      category: newTemplate.category,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setTemplates([...templates, template]);
    setShowNewTemplateModal(false);
    setNewTemplate({
      name: '',
      subject: '',
      content: '',
      type: 'email',
      category: 'marketing'
    });

    toast({
      title: "✅ Template Created",
      description: `Template "${template.name}" has been created successfully.`,
    });
  };

  const handleSendNotification = async () => {
    if (!newNotification.message) {
      toast({
        title: "Validation Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    if (newNotification.type === 'email' && !newNotification.subject) {
      toast({
        title: "Validation Error",
        description: "Please enter a subject for email notifications",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "Please log in to send notifications",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS.SEND_BULK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          type: newNotification.type,
          audience: newNotification.audience,
          subject: newNotification.subject,
          message: newNotification.message
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "✅ Notification Sent!",
          description: `${newNotification.type.toUpperCase()} notification sent to ${data.data.sent} users successfully.`,
        });

        // Reset form
        setNewNotification({
          type: 'email',
          audience: 'all',
          subject: '',
          message: '',
          scheduleType: 'now',
          scheduledDate: '',
          scheduledTime: ''
        });
      } else {
        throw new Error(data.message || 'Failed to send notification');
      }
    } catch (error) {
      toast({
        title: "Failed to send",
        description: error instanceof Error ? error.message : "There was an error sending the notification.",
        variant: "destructive",
      });
    }
  };

  const [audienceSizes, setAudienceSizes] = useState({
    all: 0,
    enterprise: 0,
    business: 0,
    free: 0,
    custom: 0
  });

  const fetchAudienceSizes = useCallback(async () => {
    try {
      // Fetch all profiles count
      const profilesResult: any = await supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true });
      const allProfilesCount = profilesResult.count as number | null;
  
      // Fetch enterprise subscriptions count
      // @ts-expect-error - Supabase type inference issue with complex queries
      const enterpriseResult: any = await supabase
        .from('user_subscriptions')
        .select('user_id', { count: 'exact', head: true })
        .eq('plan_type', 'enterprise')
        .eq('status', 'active');
      const enterpriseCount = enterpriseResult.count as number | null;
  
      // Fetch business subscriptions count
      const businessResult: any = await supabase
        .from('user_subscriptions')
        .select('user_id', { count: 'exact', head: true })
        .eq('plan_type', 'business')
        .eq('status', 'active');
      const businessCount = businessResult.count as number | null;
  
      // Fetch all active subscriptions count
      const allSubsResult: any = await supabase
        .from('user_subscriptions')
        .select('user_id', { count: 'exact', head: true })
        .eq('status', 'active');
      const allSubsCount = allSubsResult.count as number | null;
  
      setAudienceSizes({
        all: allProfilesCount ?? 0,
        enterprise: enterpriseCount ?? 0,
        business: businessCount ?? 0,
        free: (allProfilesCount ?? 0) - (allSubsCount ?? 0),
        custom: 0
      });
    } catch (error) {
    }
  }, []);

  useEffect(() => {
    fetchAudienceSizes();
  }, [fetchAudienceSizes]);

  const getAudienceSize = (audience: string) => {
    return audienceSizes[audience as keyof typeof audienceSizes] || 0;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      scheduled: 'outline',
      sending: 'default',
      completed: 'default',
      failed: 'destructive'
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Notification Center</h2>
          <p className="text-muted-foreground">Send notifications and manage communication with users</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="send">Send Notification</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send New Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Notification Type</Label>
                  <Select 
                    value={newNotification.type} 
                    onValueChange={(value: 'email' | 'sms' | 'push') => 
                      setNewNotification(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="sms">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          SMS
                        </div>
                      </SelectItem>
                      <SelectItem value="push">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Push Notification
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select 
                    value={newNotification.audience} 
                    onValueChange={(value: any) => 
                      setNewNotification(prev => ({ ...prev, audience: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users ({getAudienceSize('all').toLocaleString()})</SelectItem>
                      <SelectItem value="enterprise">Enterprise Users ({getAudienceSize('enterprise').toLocaleString()})</SelectItem>
                      <SelectItem value="business">Business Users ({getAudienceSize('business').toLocaleString()})</SelectItem>
                      <SelectItem value="free">Free Users ({getAudienceSize('free').toLocaleString()})</SelectItem>
                      <SelectItem value="custom">Custom Segment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newNotification.type === 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Enter email subject"
                    value={newNotification.subject}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your message here..."
                  rows={6}
                  value={newNotification.message}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Send Time</Label>
                  <Select 
                    value={newNotification.scheduleType} 
                    onValueChange={(value: 'now' | 'scheduled') => 
                      setNewNotification(prev => ({ ...prev, scheduleType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">Send Now</SelectItem>
                      <SelectItem value="scheduled">Schedule for Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newNotification.scheduleType === 'scheduled' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="scheduledDate">Date</Label>
                      <Input
                        id="scheduledDate"
                        type="date"
                        value={newNotification.scheduledDate}
                        onChange={(e) => setNewNotification(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduledTime">Time</Label>
                      <Input
                        id="scheduledTime"
                        type="time"
                        value={newNotification.scheduledTime}
                        onChange={(e) => setNewNotification(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Save as Template</Button>
                <Button onClick={handleSendNotification}>
                  <Send className="h-4 w-4 mr-2" />
                  {newNotification.scheduleType === 'now' ? 'Send Now' : 'Schedule'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{campaign.name}</h4>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Template: {campaign.template} • Created: {campaign.createdAt}
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Recipients: {campaign.recipients.toLocaleString()}</span>
                        <span>Sent: {campaign.sent.toLocaleString()}</span>
                        <span>Opened: {campaign.opened.toLocaleString()}</span>
                        <span>Clicked: {campaign.clicked.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Notification Templates</CardTitle>
                <Button onClick={() => setShowNewTemplateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant="outline">{template.type}</Badge>
                        <Badge variant="secondary">{template.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.subject}</p>
                      <p className="text-xs text-muted-foreground">Created: {template.createdAt}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Use</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Template Modal */}
      <Dialog open={showNewTemplateModal} onOpenChange={setShowNewTemplateModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a reusable notification template for emails, SMS, or push notifications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="template_name">Template Name *</Label>
              <Input
                id="template_name"
                placeholder="e.g., Welcome Email"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template_type">Type</Label>
                <select
                  id="template_type"
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate({...newTemplate, type: e.target.value as any})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push Notification</option>
                </select>
              </div>
              <div>
                <Label htmlFor="template_category">Category</Label>
                <select
                  id="template_category"
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value as any})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="marketing">Marketing</option>
                  <option value="system">System</option>
                  <option value="billing">Billing</option>
                  <option value="security">Security</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="template_subject">Subject/Title *</Label>
              <Input
                id="template_subject"
                placeholder="Notification subject or title"
                value={newTemplate.subject}
                onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="template_content">Content *</Label>
              <Textarea
                id="template_content"
                placeholder="Write your notification content here... You can use variables like {name}, {address}, etc."
                rows={6}
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tip: Use curly braces for variables, e.g., Hello {'{name}'}, your address {'{address}'} is ready!
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowNewTemplateModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTemplate} 
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationCenter;
