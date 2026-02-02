import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Database, BarChart3, Home, FileSpreadsheet } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import ProductDashboardLayout from '@/components/layout/ProductDashboardLayout';
import DirectorsDisclosureDataSource from "./DirectorsDisclosureDataSource";
import DirectorsDisclosureAnalytics from "./DirectorsDisclosureAnalytics";
import DirectorsDisclosureMasterData from "./DirectorsDisclosureMasterData";
import DirectorsDisclosureCompaniesMasterData from "./DirectorsDisclosureCompaniesMasterData";

type TabType = 'analytics' | 'datasource' | 'masterdata' | 'companies';

const DirectorsDisclosure = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define navigation items for this product
  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      href: '/',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      href: '/directors-disclosure',
      isActive: location.pathname === '/directors-disclosure' || location.pathname === '/directors-disclosure/'
    },
    {
      id: 'datasource',
      label: 'Data Source',
      icon: FileText,
      href: '/directors-disclosure/datasource',
      isActive: location.pathname === '/directors-disclosure/datasource'
    },
    {
      id: 'masterdata',
      label: 'Directors Master Data',
      icon: Database,
      href: '/directors-disclosure/masterdata',
      isActive: location.pathname === '/directors-disclosure/masterdata'
    },
    {
      id: 'companies',
      label: 'Companies Master List',
      icon: FileSpreadsheet,
      href: '/directors-disclosure/companies',
      isActive: location.pathname === '/directors-disclosure/companies'
    }
  ];

  const renderContent = () => {
    // Determine active tab based on current route
    if (location.pathname === '/directors-disclosure/datasource') {
      return <DirectorsDisclosureDataSource />;
    } else if (location.pathname === '/directors-disclosure/masterdata') {
      return <DirectorsDisclosureMasterData />;
    } else if (location.pathname === '/directors-disclosure/companies') {
      return <DirectorsDisclosureCompaniesMasterData />;
    } else {
      // Default to analytics
      return <DirectorsDisclosureAnalytics />;
    }
  };

  return (
    <ProductDashboardLayout 
      productName="Directors' Disclosure" 
      productRoute="/directors-disclosure"
      navigationItems={navigationItems}
    >
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Directors' Disclosure</h1>
            <p className="text-muted-foreground">Track and analyze directors' disclosure reports</p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </ProductDashboardLayout>
  );
};

export default DirectorsDisclosure;