import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Search, Filter, Download, Eye, Trash } from 'lucide-react';
import ProductDashboardLayout from '@/components/layout/ProductDashboardLayout';
import { Home, FileSpreadsheet } from 'lucide-react';

const MeetingMinutes = () => {
  // Define navigation items for this product
  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      href: '/',
    },
    {
      id: 'dashboard',
      label: 'Minutes Generator',
      icon: FileText,
      href: '/minutes-preparation',
    },
    {
      id: 'generator',
      label: 'Generate Minutes',
      icon: FileText,
      href: '/minutes-preparation/generate',
    },
    {
      id: 'ai-mom',
      label: 'AI MOM',
      icon: FileText,
      href: '/minutes-preparation/ai-assistant',
    },
    {
      id: 'minutes',
      label: 'Meeting Minutes',
      icon: FileText,
      href: '/minutes-preparation/minutes',
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: FileSpreadsheet,
      href: '/minutes-preparation/templates',
    }
  ];

  // Mock meeting minutes data
  const meetingMinutes = [
    {
      id: 1,
      title: 'Board Meeting - Q3 2025',
      date: '2025-09-15',
      type: 'Board of Directors',
      status: 'Approved',
      attendees: 7
    },
    {
      id: 2,
      title: 'Audit Committee Meeting',
      date: '2025-08-22',
      type: 'Committee',
      status: 'Pending Approval',
      attendees: 5
    },
    {
      id: 3,
      title: 'Annual General Meeting',
      date: '2025-07-30',
      type: 'AGM',
      status: 'Approved',
      attendees: 15
    },
    {
      id: 4,
      title: 'Board Meeting - Q2 2025',
      date: '2025-06-10',
      type: 'Board of Directors',
      status: 'Approved',
      attendees: 7
    }
  ];

  return (
    <ProductDashboardLayout 
      productName="Minutes Generator" 
      productRoute="/minutes-preparation"
      navigationItems={navigationItems}
    >
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Meeting Minutes</h1>
            <p className="text-muted-foreground">View and manage meeting minutes</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Generated Minutes
            </CardTitle>
            <CardDescription>
              List of all meeting minutes generated using the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {meetingMinutes.map((minute) => (
                <div key={minute.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{minute.title}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Date: {minute.date}</span>
                        <span>Type: {minute.type}</span>
                        <span>Status: 
                          <span className={`ml-1 ${minute.status === 'Approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {minute.status}
                          </span>
                        </span>
                        <span>Attendees: {minute.attendees}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Trash className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {meetingMinutes.length} of {meetingMinutes.length} meeting minutes
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProductDashboardLayout>
  );
};

export default MeetingMinutes;