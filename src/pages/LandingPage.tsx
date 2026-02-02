import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  TrendingUp,
  Shield,
  BarChart3,
  Globe,
  Database,
  ArrowRight,
  Star,
  Clock,
  Battery,
  FileText,
  Receipt,
  ArrowUp,
  ArrowDown,
  Link,
  ChevronRight
} from "lucide-react";
import Orb from "@/components/Orb";
import ChatbotFab from "@/components/ChatbotFab";
import { useRef, useState, useEffect } from "react";

// Add fetch for visit count
const fetchVisitCount = async (): Promise<number> => {
  try {
    // Use relative path since frontend and backend are served from the same origin
    const response = await fetch(`/visits/count`);
    if (!response.ok) {
      throw new Error('Failed to fetch visit count');
    }
    const data = await response.json();
    return data.count;
  } catch (error) {
    console.error('Error fetching visit count:', error);
    return 0; // Return 0 as fallback
  }
};

// Add function to increment visit count
const incrementVisitCount = async (): Promise<number> => {
  try {
    // Use relative path since frontend and backend are served from the same origin
    const response = await fetch(`/visits/increment`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to increment visit count');
    }
    const data = await response.json();
    return data.new_count;
  } catch (error) {
    console.error('Error incrementing visit count:', error);
    return 0; // Return 0 as fallback
  }
};

interface Product {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  status: 'Live' | 'Coming Soon';
  route: string;
  features: string[];
}

const products: Product[] = [
  {
    id: '1',
    title: "BSE Analysis",
    description: "Comprehensive analysis and monitoring of BSE market activities with advanced insights.",
    icon: <img src="/BSEINDIA.png" alt="BSE Logo" className="h-full w-full object-contain" />,
    color: "honolulu-blue", // Using standard color
    status: "Live",
    route: "/bse-alerts",
    features: [
      "Market trend analysis",
      "Real-time data monitoring",
      "Customizable dashboards",
      "Regulatory compliance tracking",
      "Advanced charting tools"
    ]
  },
  {
    id: '2',
    title: "RBI Analysis",
    description: "Regulatory compliance monitoring for Reserve Bank of India guidelines.",
    icon: <img src="/rbi-company-logo.jpg" alt="RBI Logo" className="h-full w-full object-contain" />,
    color: "dark-lavender", // Using new color
    status: "Live",
    route: "/rbi-dashboard",
    features: [
      "Monetary policy tracking",
      "Banking sector compliance",
      "Interest rate trend analysis",
      "Regulatory update notifications",
      "Compliance reporting"
    ]
  },
  {
    id: '3',
    title: "SEBI Analysis",
    description: "Market regulation analysis and investor protection measures.",
    icon: <img src="/sebi-logo.png" alt="SEBI Logo" className="h-full w-full object-contain" />,
    color: "x11-maroon", // Using new color
    status: "Live",
    route: "/sebi-dashboard",
    features: [
      "Market surveillance insights",
      "Investor protection tracking",
      "Listing agreement compliance",
      "Corporate governance analysis",
      "Regulatory reporting",
      "Standalone application"
    ]
  },
{
    id: '4',
    title: "Insider Trading",
    description: "Monitor and analyze insider trading activities and patterns.",
    icon: <Database className="h-6 w-6" />,
    color: "honolulu-blue", // Using new color
    status: "Live",
    route: "/insider-trading",
    features: [
      "Unusual trading detection",
      "Regulatory compliance tracking",
      "Risk assessment tools",
      "Reporting dashboard",
      "Alert notifications"
    ]
  },
  {
    id: '5',
    title: "Directors' Disclosure",
    description: "Comprehensive tracking and analysis of directors' disclosure reports.",
    icon: <FileText className="h-6 w-6" />,
    color: "dark-lavender", // Using new color
    status: "Live",
    route: "/directors-disclosure",
    features: [
      "Automated disclosure tracking",
      "Compliance monitoring",
      "Report generation",
      "Regulatory filing alerts",
      "Historical analysis"
    ]
  },
  {
    id: '6',
    title: "Minutes Generator",
    description: "Automated preparation and management of meeting minutes with compliance tracking.",
    icon: <FileText className="h-6 w-6" />,
    color: "x11-maroon", // Using new color
    status: "Live",
    route: "/minutes-preparation",
    features: [
      "Automated transcription",
      "Template-based formatting",
      "Action item tracking",
      "Compliance verification",
      "Digital signing support"
    ]
  }
];

const getColorClasses = (color: string) => {
  switch (color) {
    case "honolulu-blue":
      return {
        bgClass: "bg-honolulu-blue/20",
        textClass: "text-honolulu-blue",
        badgeClass: "bg-honolulu-blue"
      };
    case "dark-lavender":
      return {
        bgClass: "bg-dark-lavender/20",
        textClass: "text-dark-lavender",
        badgeClass: "bg-dark-lavender"
      };
    case "x11-maroon":
      return {
        bgClass: "bg-x11-maroon/20",
        textClass: "text-x11-maroon",
        badgeClass: "bg-x11-maroon"
      };
    default:
      return {
        bgClass: "bg-gray-200/20",
        textClass: "text-gray-800",
        badgeClass: "bg-gray-800"
      };
  }
};

// Add this new function to get the border color
const getColorForProduct = (color: string, status: 'Live' | 'Coming Soon') => {
  // If the product is live, use green color
  if (status === 'Live') {
    return "hsl(120, 80%, 40%)"; // Green color for live products
  }
  
  // For coming soon products, use the original colors
  switch (color) {
    case "honolulu-blue":
      return "hsl(202, 88%, 37%)"; // #0B74B0
    case "dark-lavender":
      return "hsl(272, 37%, 45%)"; // #75479C
    case "x11-maroon":
      return "hsl(342, 54%, 48%)"; // #BD3861
    default:
      return "#000000"; // Default black border
  }
};

// Add this new function to get the button color for live products
const getButtonColorForProduct = (status: 'Live' | 'Coming Soon') => {
  // If the product is live, use green color
  if (status === 'Live') {
    return "hsl(120, 80%, 40%)"; // Green color for live products
  }
  
  // For coming soon products, return null to use default styling
  return null;
};

// Add this new function to get the badge color for live products
const getBadgeColorForProduct = (status: 'Live' | 'Coming Soon') => {
  // If the product is live, use green color
  if (status === 'Live') {
    return "hsl(120, 80%, 40%)"; // Green color for live products
  }
  
  // For coming soon products, return null to use default styling
  return null;
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [visitCount, setVisitCount] = useState<number>(0);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Fetch visit count when component mounts
  useEffect(() => {
    const loadVisitCount = async () => {
      const count = await fetchVisitCount();
      setVisitCount(count);
    };
    
    const incrementAndLoadCount = async () => {
      // First increment the visit count
      const newCount = await incrementVisitCount();
      // Then fetch the updated count to ensure consistency
      const updatedCount = await fetchVisitCount();
      setVisitCount(updatedCount);
    };
    
    // Load initial count
    loadVisitCount();
    
    // Increment visit count for this visit
    incrementAndLoadCount();
  }, []);

  // Handle scroll to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
 
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
 
  const handleProductClick = (product: Product): void => {
    if (product.status === 'Live' && product.route) {
      // SEBI Analysis is a separate application, open in new tab
      if (product.id === '3') { // SEBI Analysis
        window.open(product.route, '_blank');
      } else {
        navigate(product.route);
      }
    }
  };
 
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
 
  const scrollToContent = () => {
    const contentElement = document.querySelector('.products-section');
    if (contentElement) {
      contentElement.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
 
  return (
    <div className="min-h-screen bg-white">
     
      {/* Orbit Section with Background Image - Fully responsive */}
      <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-white w-full">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-6xl px-4">
            <div className="relative w-full" style={{ height: 'clamp(300px, 50vw, 450px)', maxWidth: '450px', margin: '0 auto' }}>
              <Orb
                hoverIntensity={0}
                rotateOnHover={false}
                hue={0}
                forceHoverState={false}
              />
              <div
                className="absolute inset-0 flex items-center justify-center z-10"
                style={{ pointerEvents: 'none' }}
              >
                <img
                  src="/adani.svg"
                  alt="Company Logo"
                  className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 opacity-90"
                  style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}
                />
              </div>
            </div>
          </div>
        </div>
     
      {/* Project Title Section - Responsive typography */}
      <div className="container mx-auto flex justify-center py-4 sm:py-6 px-4">
        <h1
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-clip-text text-transparent text-center"
          style={{
            backgroundImage: 'linear-gradient(to right, #0B74B0, #BD3861)'
          }}
        >
          Project AEGIS
        </h1>
      </div>
      </div>
     
      {/* Scroll Down FAB - Responsive positioning */}
      <button
        onClick={scrollToContent}
        className="fixed bottom-6 left-6 sm:left-8 md:left-12 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50 hover:shadow-xl"
        style={{
          backgroundColor: '#6196FE',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
        aria-label="Scroll down to content"
      >
        <ArrowDown size={16} />
      </button>
     
      {/* Products Section - Fully responsive grid */}
      <div className="products-section container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 min-h-screen">
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {products.map((product) => {
              const colorClasses = getColorClasses(product.color);
              return (
                <div
                  key={product.id}
                  className={`${product.status === 'Live' ? 'cursor-pointer' : 'cursor-default'} w-full`}
                  onClick={() => handleProductClick(product)}
                >
                  <Card 
                    className="h-full relative overflow-hidden border-2 transition-all duration-300 flex flex-col w-full"
                    style={{
                      background: "#ffffff",
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      borderWidth: '2px',
                      borderColor: getColorForProduct(product.color, product.status),
                      fontFamily: 'Adani, sans-serif'
                    }}
                  >
                    <CardHeader className="pb-4 pt-5 px-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={`rounded-lg flex-shrink-0 flex items-center justify-center ${colorClasses.bgClass} ${colorClasses.textClass}`}
                          style={{
                            width: '48px',
                            height: '48px'
                          }}
                        >
                          {product.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg font-bold truncate" style={{ color: '#000000', fontFamily: 'Adani, sans-serif' }}>
                              {product.title}
                            </CardTitle>
                            {product.status === 'Live' ? (
                              <Badge
                                variant="default"
                                className="ml-2 mt-1 px-2 py-1 text-xs whitespace-nowrap flex-shrink-0 text-white"
                                style={{
                                  backgroundColor: getBadgeColorForProduct(product.status),
                                  fontFamily: 'Adani, sans-serif'
                                }}
                              >
                                Live
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="ml-2 mt-1 px-2 py-1 text-xs whitespace-nowrap flex-shrink-0"
                                style={{
                                  color: '#000000',
                                  borderColor: 'black',
                                  background: 'transparent',
                                  fontWeight: 'bold',
                                  fontFamily: 'Adani, sans-serif'
                                }}
                              >
                                <Clock className="h-3 w-3 mr-1 inline" />
                                SOON
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
 
                    <CardContent className="flex-1 flex flex-col px-5 pb-5">
                      {/* Features List */}
                      <div className="flex-1">
                        <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#000000', fontFamily: 'Adani, sans-serif' }}>
                          Key Features:
                        </h4>
                        <div className="space-y-2">
                          {product.features.slice(0, 4).map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                                style={{ backgroundColor: product.color }}
                              />
                              <span className="text-xs leading-snug" style={{ color: '#000000', fontFamily: 'Adani, sans-serif' }}>
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
 
                      {/* Action Button */}
                      <div className="pt-6">
                        {product.status === 'Live' ? (
                          <Button
                            className="w-full flex items-center justify-center gap-2 h-10 text-sm"
                            style={{
                              backgroundColor: getButtonColorForProduct(product.status),
                              borderColor: getButtonColorForProduct(product.status),
                              color: 'white',
                              fontFamily: 'Adani, sans-serif'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProductClick(product);
                            }}
                          >
                            Launch Application
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full cursor-not-allowed h-10 text-sm"
                            disabled
                            style={{
                              color: '#000000',
                              borderColor: '#000000',
                              fontWeight: 'bold',
                              fontFamily: 'Adani, sans-serif'
                            }}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Coming Soon
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>
 
      {/* Footer Section - Responsive layout */}
      <div className="border-t py-6">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 text-sm" style={{ color: '#000000', fontFamily: 'Adani, sans-serif' }}>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 text-sm text-foreground" style={{ fontFamily: 'Adani, sans-serif' }}>
            <a 
              href="/hierarchy-structure" 
              className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200 transition-colors"
            >
              Agent Organogram
              <ChevronRight className="ml-1 w-3 h-3" />
            </a>
          </div>
          {/* New Footer Content with Live Visit Count */}
          <div className="mt-4 text-sm" style={{ color: '#000000', fontFamily: 'Adani, sans-serif' }}>
            Total Visits: {visitCount.toLocaleString()} | Powered By – Adani Green Energy Limited
          </div>
        </div>
      </div>
 
      {/* Scroll to Top FAB - Responsive positioning */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 sm:left-8 md:left-12 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50 hover:shadow-xl"
          style={{
            backgroundColor: '#6196FE',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
          aria-label="Scroll to top"
        >
          <ArrowUp size={16} />
        </button>
      )}
      <ChatbotFab />
      
    </div>
  );
};

export default LandingPage;
