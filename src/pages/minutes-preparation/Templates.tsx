import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Plus, Edit, Trash, Eye } from 'lucide-react';
import ProductDashboardLayout from '@/components/layout/ProductDashboardLayout';
import { Home, FileSpreadsheet } from 'lucide-react';
import { Link } from 'react-router-dom';

const Templates = () => {
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

  // Mock template data
  const templates = [
    {
      id: 1,
      name: 'Board of Directors Meeting Template',
      type: 'Board Meeting',
      lastModified: '2025-10-15',
      version: '1.2'
    },
    {
      id: 2,
      name: 'Committee Meeting Template',
      type: 'Committee',
      lastModified: '2025-09-22',
      version: '1.0'
    },
    {
      id: 3,
      name: 'Annual General Meeting Template',
      type: 'AGM',
      lastModified: '2025-08-30',
      version: '1.1'
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
            <h1 className="text-3xl font-bold">Template Management</h1>
            <p className="text-muted-foreground">Manage meeting minutes templates</p>
          </div>
          <div className="flex gap-2">
            <Link to="/minutes-preparation/renderer">
              <Button variant="outline" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Template Renderer
              </Button>
            </Link>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Template
            </Button>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6" />
              Available Templates
            </CardTitle>
            <CardDescription>
              Manage and customize your meeting minutes templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Type: {template.type}</span>
                        <span>Version: {template.version}</span>
                        <span>Last modified: {template.lastModified}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Edit className="h-4 w-4" />
                      Edit
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
            
            <div className="mt-8 p-4 border-2 border-dashed rounded-lg text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Upload New Template</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop a DOCX file here or click to browse
              </p>
              <Button variant="outline" className="flex items-center gap-2 mx-auto">
                <Upload className="h-4 w-4" />
                Select File
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProductDashboardLayout>
  );
};

export default Templates;