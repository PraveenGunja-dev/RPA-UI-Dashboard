import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Bell, Mail } from 'lucide-react';
import RBIAnalysisDashboardLayout from '@/components/layout/RBIAnalysisDashboardLayout';

const RBIAnalysis = () => {
  const navigate = useNavigate();

  // Add scroll to top effect
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Redirect to the RBI dashboard since this is the main page
    navigate('/rbi-dashboard');
  }, [navigate]);

  return (
    <RBIAnalysisDashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">RBI Analysis</h1>
            <p className="text-muted-foreground">Reserve Bank of India regulatory analysis and compliance monitoring</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/rbi-dashboard')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dashboard</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Overview</div>
              <p className="text-xs text-muted-foreground">System overview and analytics</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/rbi-notifications')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Alerts</div>
              <p className="text-xs text-muted-foreground">Regulatory notifications</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/rbi-emaildata')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Data</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Contacts</div>
              <p className="text-xs text-muted-foreground">Email management</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Coming</div>
              <p className="text-xs text-muted-foreground">Advanced analytics</p>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-2xl mx-auto mt-12">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">RBI Analysis Platform</CardTitle>
            <CardDescription>
              Comprehensive Reserve Bank of India regulatory analysis and compliance monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              This platform provides comprehensive analysis of Reserve Bank of India regulations, 
              monetary policy updates, compliance requirements, and regulatory insights for financial institutions.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Key Features:</h3>
              <ul className="text-left list-disc pl-5 space-y-1 text-sm">
                <li>Monetary policy analysis and impact assessment</li>
                <li>Regulatory compliance monitoring</li>
                <li>Interest rate trend analysis</li>
                <li>Banking sector regulatory updates</li>
                <li>Compliance reporting tools</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </RBIAnalysisDashboardLayout>
  );
};

export default RBIAnalysis;