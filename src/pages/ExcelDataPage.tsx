import React from 'react';
import BSEAlertsDashboardLayout from '@/components/layout/BSEAlertsDashboardLayout';
import ExcelDataLoader from '@/components/ExcelDataLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Globe } from 'lucide-react';
import NotificationBar from '@/components/ui/NotificationBar';

const ExcelDataPage = () => {
  return (
    <BSEAlertsDashboardLayout>
      <NotificationBar />
      
      <div className="min-h-screen p-6" style={{ background: "#FFFFFF" }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#010741' }}>Excel Data Dashboard</h1>
          <p className="text-lg" style={{ color: '#46798E' }}>
            View and analyze data from email and entity Excel files
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Email Data Section */}
          <Card className="h-full" style={{ background: "#ffffff", border: "1px solid rgba(97, 150, 254, 0.3)" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <FileText className="h-6 w-6" style={{ color: '#6196FE' }} />
                <span style={{ color: '#301B89' }}>Email Data (email.xlsx)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExcelDataLoader 
                fileName="email.xlsx" 
                title="Email Notifications Data" 
              />
            </CardContent>
          </Card>
          
          {/* Entity Data Section */}
          <Card className="h-full" style={{ background: "#ffffff", border: "1px solid rgba(97, 150, 254, 0.3)" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Globe className="h-6 w-6" style={{ color: '#6196FE' }} />
                <span style={{ color: '#301B89' }}>Entity Data (entity.xlsx)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExcelDataLoader 
                fileName="entity.xlsx" 
                title="Entity Website Data" 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </BSEAlertsDashboardLayout>
  );
};

export default ExcelDataPage;