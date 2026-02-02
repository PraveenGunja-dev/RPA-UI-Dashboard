import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Database, BarChart3, Home, FileSpreadsheet } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import ProductDashboardLayout from '@/components/layout/ProductDashboardLayout';
import DirectorsDisclosureDataSource from "./DirectorsDisclosure/DirectorsDisclosureDataSource";
import DirectorsDisclosureAnalytics from "./DirectorsDisclosure/DirectorsDisclosureAnalytics";
import DirectorsDisclosureMasterData from "./DirectorsDisclosure/DirectorsDisclosureMasterData";
import DirectorsDisclosureCompaniesMasterData from "./DirectorsDisclosure/DirectorsDisclosureCompaniesMasterData";

type TabType = 'analytics' | 'datasource' | 'masterdata' | 'companies';

const DirectorsDisclosure = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define navigation items for this product using useMemo to prevent unnecessary re-renders
  const navigationItems = useMemo(() => {
    // Get the current path without query params or hash
    const currentPath = location.pathname;
    
    return [
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
        isActive: currentPath === '/directors-disclosure' || currentPath === '/directors-disclosure/'
      },
      {
        id: 'datasource',
        label: 'Data Source',
        icon: FileText,
        href: '/directors-disclosure/data-source',
        isActive: currentPath === '/directors-disclosure/data-source'
      },
      {
        id: 'masterdata',
        label: 'Directors Master Data',
        icon: Database,
        href: '/directors-disclosure/master-data',
        isActive: currentPath === '/directors-disclosure/master-data'
      },
      {
        id: 'companies',
        label: 'Companies Master List',
        icon: FileSpreadsheet,
        href: '/directors-disclosure/companies-master-data',
        isActive: currentPath === '/directors-disclosure/companies-master-data'
      }
    ];
  }, [location.pathname]);

  const renderContent = () => {
    // Determine active tab based on current route
    if (location.pathname.endsWith('/data-source')) {
      return <DirectorsDisclosureDataSource />;
    } else if (location.pathname.endsWith('/master-data')) {
      return <DirectorsDisclosureMasterData />;
    } else if (location.pathname.endsWith('/companies-master-data')) {
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