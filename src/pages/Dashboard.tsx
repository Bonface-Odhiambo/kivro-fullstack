import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Package,
  Truck,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const stats = [
  {
    title: 'Total Kivro Addresses',
    value: '2,847',
    change: '+12.5%',
    changeType: 'positive',
    icon: MapPin,
    color: 'text-primary'
  },
  {
    title: 'Active Packages',
    value: '1,234',
    change: '+8.2%',
    changeType: 'positive', 
    icon: Package,
    color: 'text-accent-orange'
  },
  {
    title: 'In Transit',
    value: '456',
    change: '-3.1%',
    changeType: 'negative',
    icon: Truck,
    color: 'text-blue-600'
  },
  {
    title: 'Delivered Today',
    value: '189',
    change: '+15.7%',
    changeType: 'positive',
    icon: CheckCircle,
    color: 'text-green-600'
  }
];

const recentPackages = [
  {
    id: 'KV001234',
    sender: 'Ahmed Mohamed',
    recipient: 'Fatima Hassan',
    destination: 'Mogadishu, Somalia',
    status: 'in_transit',
    created: '2 hours ago'
  },
  {
    id: 'KV001235',
    sender: 'Omar Ali',
    recipient: 'Khadija Ahmed',
    destination: 'Hargeisa, Somalia', 
    status: 'delivered',
    created: '4 hours ago'
  },
  {
    id: 'KV001236',
    sender: 'Sahra Ibrahim',
    recipient: 'Hassan Omar',
    destination: 'Kismayo, Somalia',
    status: 'pending',
    created: '6 hours ago'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'in_transit': return 'bg-blue-100 text-blue-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function Dashboard() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Welcome to Kivro - Somalia's Digital Postal System
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-dark w-full sm:w-auto">
          <MapPin className="h-4 w-4 mr-2" />
          Create Address
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center text-xs sm:text-sm mt-1">
                <TrendingUp className={`h-3 w-3 mr-1 ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`} />
                <span className={
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }>
                  {stat.change}
                </span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Packages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Recent Packages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPackages.map((pkg) => (
                <div key={pkg.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{pkg.id}</span>
                      <Badge className={getStatusColor(pkg.status)}>
                        {pkg.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pkg.sender} → {pkg.recipient}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      To: {pkg.destination}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {pkg.created}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                <span className="text-sm">Generate Address</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Package className="h-6 w-6 text-accent-orange" />
                <span className="text-sm">Create Package</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Truck className="h-6 w-6 text-blue-600" />
                <span className="text-sm">Track Package</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Users className="h-6 w-6 text-green-600" />
                <span className="text-sm">Manage Users</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-accent-orange" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="font-medium text-green-800">RFID System</p>
                <p className="text-sm text-green-600">All systems operational</p>
              </div>
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="font-medium text-green-800">QR Scanning</p>
                <p className="text-sm text-green-600">Online - 47 active scanners</p>
              </div>
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <p className="font-medium text-yellow-800">AI Address Gen</p>
                <p className="text-sm text-yellow-600">Maintenance mode</p>
              </div>
              <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}