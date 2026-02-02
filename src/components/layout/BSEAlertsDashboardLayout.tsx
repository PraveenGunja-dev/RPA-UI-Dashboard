import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Mail,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bell,
  Globe,
  Database,
  Activity,
  LucideIcon,
  ShieldAlert,
  LogOut
} from "lucide-react";
import { hasRole, logoutUser } from "@/utils/adminAuth";

interface BSEAlertsDashboardLayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  isActive?: boolean;
}

const BSEAlertsDashboardLayout = ({ children }: BSEAlertsDashboardLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: LayoutDashboard,
      href: '/',
      isActive: location.pathname === '/'
    },
    {
      id: 'dashboard',
      label: 'BSE Alerts',
      icon: Activity,
      href: '/bse-alerts',
      isActive: location.pathname === '/bse-alerts'
    },
    {
      id: 'notifications',
      label: 'Total Notifications',
      icon: Bell,
      href: '/notifications',
      isActive: location.pathname === '/notifications'
    },
    {
      id: 'emaildata',
      label: 'Email Data',
      icon: Mail,
      href: '/emaildata',
      isActive: location.pathname === '/emaildata'
    },
    {
      id: 'websitedata',
      label: 'Website Data',
      icon: Globe,
      href: '/websitedata',
      isActive: location.pathname === '/websitedata'
    },
    ...(hasRole('admin') ? [{
      id: 'usermanagement',
      label: 'User Management',
      icon: ShieldAlert,
      href: '/user-management',
      isActive: location.pathname === '/user-management'
    }] : [])
  ];

  const handleNavigation = (item: NavigationItem): void => {
    navigate(item.href);
  };

  const sidebarVariants = {
    expanded: { width: "256px" }, // Fixed width instead of percentage
    collapsed: { width: "64px" }   // Fixed width for collapsed state
  };

  const contentVariants = {
    expanded: { marginLeft: "0" },
    collapsed: { marginLeft: "0" }
  };

  // Fixed margins for stable layout
  const getContentMargin = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return "0"; // No margin on mobile/tablet
    }
    return isCollapsed ? "64px" : "256px";
  };

  return (
    <div className="min-h-screen relative" style={{
      background: "#ffffff",
      overflow: "hidden" // Prevent horizontal scroll
    }}>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg transition-colors"
        style={{
          backgroundColor: 'rgba(30, 64, 175, 0.1)',
          border: '1px solid rgba(30, 64, 175, 0.3)',
          color: '#1E40AF'
        }}
      >
        <Menu size={20} />
      </button>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isCollapsed ? "collapsed" : "expanded"}
        className="fixed left-0 top-0 h-full z-40 border-r transition-all duration-300 hidden lg:block"
        style={{
          background: "#ffffff",
          borderColor: "rgba(0, 0, 0, 0.3)",
          boxShadow: 'none',
          border: '2px solid rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b" style={{ borderColor: "rgba(0, 0, 0, 0.2)" }}>
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <img
                    src="/adani.svg"
                    alt="AGEIS Logo"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <h2 className="font-bold text-lg" style={{ color: '#000000' }}>
                  BSE Alerts
                </h2>
              </motion.div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded transition-colors"
              style={{ color: '#000000' }}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigation(item)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group ${item.isActive ? 'shadow-lg' : 'hover:shadow-md'
                      }`}
                    style={{
                      backgroundColor: item.isActive
                        ? 'rgba(30, 64, 175, 0.1)'
                        : 'transparent',
                      color: item.isActive ? '#000000' : '#000000',
                      border: item.isActive
                        ? '1px solid rgba(30, 64, 175, 0.3)'
                        : '1px solid transparent'
                    }}
                  >
                    <IconComponent
                      size={20}
                      className={`flex-shrink-0 transition-colors ${item.isActive ? 'text-[#000000]' : 'text-[#000000] group-hover:text-[#000000]'
                        }`}
                    />
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="font-medium truncate"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t shadow-sm" style={{ borderColor: "rgba(0, 0, 0, 0.2)" }}>
          <div className="space-y-2">
            <button
              onClick={() => {
                logoutUser();
                window.location.href = '/';
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-red-50 hover:text-red-600 group border border-transparent hover:border-red-200 text-[#000000]"
            >
              <LogOut size={20} className="flex-shrink-0" />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-medium truncate"
                >
                  Logout
                </motion.span>
              )}
            </button>

            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs pt-2"
                style={{ color: 'rgba(0, 0, 0, 0.7)' }}
              >
                <div>STATUS: ONLINE</div>
                <div>VER: 1.0.0</div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
            onClick={() => setIsMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="w-64 h-full border-r"
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #ffffff 50%, #ffffff 100%)",
                borderColor: "rgba(0, 0, 0, 0.3)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Sidebar Content - Same as desktop */}
              <div className="p-4 border-b" style={{ borderColor: "rgba(0, 0, 0, 0.2)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <img
                      src="/adani.svg"
                      alt="AGEIS Logo"
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <h2 className="font-bold text-lg" style={{ color: '#000000' }}>
                    BSE Alerts
                  </h2>
                </div>
              </div>

              <nav className="flex-1 p-4">
                <ul className="space-y-2">
                  {navigationItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => {
                            handleNavigation(item);
                            setIsMobileOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${item.isActive ? 'shadow-lg' : 'hover:shadow-md'
                            }`}
                          style={{
                            backgroundColor: item.isActive
                              ? 'rgba(30, 64, 175, 0.1)'
                              : 'transparent',
                            color: item.isActive ? '#000000' : '#000000',
                            border: item.isActive
                              ? '1px solid rgba(30, 64, 175, 0.3)'
                              : '1px solid transparent'
                          }}
                        >
                          <IconComponent size={20} className="flex-shrink-0" />
                          <span className="font-medium">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                  <li className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(0, 0, 0, 0.1)" }}>
                    <button
                      onClick={() => {
                        logoutUser();
                        window.location.href = '/';
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={20} className="flex-shrink-0" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </li>
                </ul>
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Fixed positioning layout */}
      <main
        className="transition-all duration-300"
        style={{
          marginLeft: getContentMargin(),
          minHeight: "100vh",
          width: `calc(100% - ${getContentMargin()})`,
          position: "relative",
          overflowX: "hidden", // Prevent horizontal overflow
          overflowY: "auto",    // Allow vertical scrolling
          paddingTop: "0"      // No global notification bar
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default BSEAlertsDashboardLayout;