import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Database, BarChart3, FileText, BookOpen, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import ProductDashboardLayout from '@/components/layout/ProductDashboardLayout';
import EnhancedInsiderTradingAnalytics from "./InsiderTrading/EnhancedInsiderTradingAnalytics";
import InsiderTradingDataSource from "./InsiderTrading/InsiderTradingDataSource";
import InsiderTradingMasterData from "./InsiderTrading/InsiderTradingMasterData";
import InsiderTradingDocumentation from "./InsiderTrading/InsiderTradingDocumentation";

type TabType = 'analytics' | 'datasource' | 'masterdata' | 'documentation' | 'home';

const InsiderTrading = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Add effect to listen for documentation tab switch event
  useEffect(() => {
    const handleSwitchToDocumentation = () => {
      navigate('/insider-trading/documentation');
    };

    window.addEventListener('switchToDocumentationTab', handleSwitchToDocumentation);
    return () => {
      window.removeEventListener('switchToDocumentationTab', handleSwitchToDocumentation);
    };
  }, [navigate]);

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
        href: '/insider-trading',
        isActive: currentPath === '/insider-trading' || currentPath === '/insider-trading/'
      },
      {
        id: 'datasource',
        label: 'Data Source',
        icon: FileText,
        href: '/insider-trading/data-source',
        isActive: currentPath.endsWith('/data-source')
      },
      {
        id: 'masterdata',
        label: 'Master Data',
        icon: Database,
        href: '/insider-trading/master-data',
        isActive: currentPath.endsWith('/master-data')
      },
      {
        id: 'documentation',
        label: 'Documentation',
        icon: BookOpen,
        href: '/insider-trading/documentation',
        isActive: currentPath.endsWith('/documentation')
      }
    ];
  }, [location.pathname]);

  const renderContent = () => {
    // Determine active tab based on current route
    if (location.pathname.endsWith('/data-source')) {
      return <InsiderTradingDataSource />;
    } else if (location.pathname.endsWith('/master-data')) {
      return <InsiderTradingMasterData />;
    } else if (location.pathname.endsWith('/documentation')) {
      return <InsiderTradingDocumentation />;
    } else {
      // Default to analytics
      return <EnhancedInsiderTradingAnalytics />;
    }
  };

  return (
    <ProductDashboardLayout 
      productName="Insider Trading" 
      productRoute="/insider-trading"
      navigationItems={navigationItems}
    >
      <div className="container mx-auto py-6">
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

export default InsiderTrading;