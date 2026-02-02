import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Bell, 
  BarChart3,
  Home,
  Menu,
  X,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SEBIDashboardLayout = ({ 
  children,
  title = "SEBI Dashboard"
}: { 
  children: React.ReactNode;
  title?: string;
}) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation items
  const navItems = [
    {
      name: "Dashboard",
      href: "/sebi-dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/sebi-dashboard"
    },
    {
      name: "Notifications",
      href: "/sebi-notifications",
      icon: Bell,
      active: location.pathname === "/sebi-notifications"
    },
    {
      name: "Email Data",
      href: "/sebi-emaildata",
      icon: Mail,
      active: location.pathname === "/sebi-emaildata"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#ffffff" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "rgba(0, 0, 0, 0.1)" }}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <Link to="/sebi-dashboard" className="flex items-center space-x-2">
                <div 
                  className="flex items-center justify-center rounded-lg p-2"
                  style={{ 
                    background: "linear-gradient(135deg, #0B74B0, #BD3861)",
                  }}
                >
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <span 
                  className="text-xl font-bold"
                  style={{ 
                    background: "linear-gradient(135deg, #0B74B0, #BD3861)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text"
                  }}
                >
                  SEBI Dashboard
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.active
                        ? "text-white"
                        : "text-gray-700 hover:text-gray-900"
                    }`}
                    style={{
                      backgroundColor: item.active ? "#BD3861" : "transparent"
                    }}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t"
            style={{ borderColor: "rgba(0, 0, 0, 0.1)" }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      item.active
                        ? "text-white"
                        : "text-gray-700 hover:text-gray-900"
                    }`}
                    style={{
                      backgroundColor: item.active ? "#BD3861" : "transparent"
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-6" style={{ borderColor: "rgba(0, 0, 0, 0.1)" }}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm" style={{ color: "rgba(0, 0, 0, 0.6)" }}>
              © 2025 Adani Green Energy Limited . All rights reserved.
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Link 
                to="/" 
                className="text-sm flex items-center text-gray-600 hover:text-gray-900"
              >
                <Home className="h-4 w-4 mr-1" />
                Back to Main
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SEBIDashboardLayout;