import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import TotalNotifications from "./pages/TotalNotifications";
import EmailData from "./pages/EmailData";
import WebsiteData from "./pages/WebsiteData";
import WorkbookData from "./pages/WorkbookData";
import TotalWorkbookNotifications from "./pages/TotalWorkbookNotifications";
import WeeklyAnalysis from "./pages/WeeklyAnalysis";
import NotFound from "./pages/NotFound";
import ExcelDataPage from "./pages/ExcelDataPage";

// Import financial analysis pages (future products)
import BSEIndiaAnalysis from "./pages/BSEIndiaAnalysis";
import RBIAnalysis from "./pages/RBIAnalysis";
import InsiderTrading from "./pages/InsiderTrading";
import DirectorsDisclosure from "./pages/DirectorsDisclosure";
import MinutesPreparation from "./pages/MinutesPreparation";
import FormBasedGenerator from "./pages/minutes-preparation/FormBasedGenerator";
import AIAssistant from "./pages/minutes-preparation/AIAssistant";
// Removed unused imports

// Import SEBI specific pages
import SEBIDashboard from "./pages/SEBIDashboard";
import SEBITotalNotifications from "./pages/SEBITotalNotifications";
import SEBIEmailData from "./pages/SEBIEmailData";

// Import RBI specific pages
import RBIDashboard from "./pages/RBIDashboard";
import RBITotalNotifications from "./pages/RBITotalNotifications";
import RBIEmailData from "./pages/RBIEmailData";
// RBIAnalysis already imported above

// Import product-specific dashboard layouts
import BSEAlertsDashboardLayout from "@/components/layout/BSEAlertsDashboardLayout";
import RBIAnalysisDashboardLayout from "@/components/layout/RBIAnalysisDashboardLayout";
import HierarchyStructure from "./pages/HierarchyStructure";
import UserManagement from "./pages/UserManagement";

// Import Directors Disclosure sub-pages
// DirectorsDisclosureMasterData import removed – module not found
import DirectorsDisclosureAnalytics from "./pages/DirectorsDisclosure/DirectorsDisclosureAnalytics";
// DirectorsDisclosureDataSource import removed – module not found
import DirectorsDisclosureCompaniesMasterData from "./pages/DirectorsDisclosure/DirectorsDisclosureCompaniesMasterData";
import DirectorsDisclosureMasterData from "./pages/DirectorsDisclosure/DirectorsDisclosureMasterData";
import DirectorsDisclosureDataSource from "./pages/DirectorsDisclosure/DirectorsDisclosureDataSource";

import { storeUserSession } from "@/utils/adminAuth";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Check for authentication callback data in the URL hash
    const hash = window.location.hash;
    if (hash.includes('auth_success=true')) {
      try {
        const params = new URLSearchParams(hash.substring(1)); // Remove the #
        const token = params.get('token');
        const userDataRaw = params.get('user');

        if (token && userDataRaw) {
          const user = JSON.parse(decodeURIComponent(userDataRaw));
          storeUserSession({
            success: true,
            message: 'Authenticated via SSO',
            token,
            user
          });

          // Clear hash and redirect to dashboard
          window.location.hash = '';
          window.location.href = '/dashboard';
        }
      } catch (err) {
        console.error('Error parsing auth callback:', err);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SonnerToaster />
        <BrowserRouter>
          <Routes>
            {/* Main landing page */}
            <Route path="/" element={<LandingPage />} />

            {/* Current BSE India Analysis routes (main product) */}
            <Route path="/bse-alerts" element={<Dashboard />} />
            <Route path="/notifications" element={<TotalNotifications />} />
            <Route path="/emaildata" element={<EmailData />} />
            <Route path="/websitedata" element={<WebsiteData />} />
            <Route path="/workbook-data" element={<WorkbookData />} />
            <Route path="/total-workbook-notifications" element={<TotalWorkbookNotifications />} />
            <Route path="/weekly-analysis" element={<WeeklyAnalysis />} />

            {/* SEBI Analysis routes */}
            <Route path="/sebi-dashboard" element={<SEBIDashboard />} />
            <Route path="/sebi-notifications" element={<SEBITotalNotifications />} />
            <Route path="/sebi-emaildata" element={<SEBIEmailData />} />

            {/* RBI Analysis routes */}
            <Route path="/rbi-analysis" element={<RBIAnalysis />} />
            <Route path="/rbi-dashboard" element={<RBIDashboard />} />
            <Route path="/rbi-notifications" element={<RBITotalNotifications />} />
            <Route path="/rbi-emaildata" element={<RBIEmailData />} />

            {/* Excel Data page */}
            <Route path="/excel-data" element={<ExcelDataPage />} />

            {/* Future product routes */}
            <Route path="/insider-trading/*" element={<InsiderTrading />} />
            <Route path="/directors-disclosure/*" element={<DirectorsDisclosure />} />
            {/* Removed individual routes for sub-pages as they should be rendered within the main layout */}
            <Route path="/minutes-preparation/directors" element={<MinutesPreparation />} />
            <Route path="/minutes-preparation" element={<MinutesPreparation />} />
            <Route path="/minutes-preparation/form-generator" element={<FormBasedGenerator />} />
            <Route path="/minutes-preparation/ai-assistant" element={<AIAssistant />} />
            {/* Removed unused routes */}
            <Route path="/hierarchy-structure" element={<HierarchyStructure />} />

            {/* Legacy product routes - redirect to main product */}
            <Route path="/ageis-wind" element={<Dashboard />} />
            <Route path="/ageis-solar" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Admin routes */}
            <Route path="/user-management" element={<UserManagement />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
