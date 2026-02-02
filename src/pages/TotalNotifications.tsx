import { useState, useEffect, useCallback, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, X, Bell, TrendingUp, BarChart3, Activity, ExternalLink, FileText, FileSpreadsheet, PieChart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import BSEAlertsDashboardLayout from "@/components/layout/BSEAlertsDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import ExcelView from "../components/ui/ExcelView";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, BarChart } from "recharts";
import { DateRange, filterDailyDataByDateRange, dailyData } from "@/data/mockData";
import NotificationBar from "@/components/ui/NotificationBar";

// Define types for workbook data
interface ExcelData {
  [key: string]: string | number;
}

interface CombinedWorkbookData {
  file_name: string;
  sheets: string[];
  combined_data: ExcelData[];
  count: number;
  special_sheets_excluded: string[];
}

interface SpecialSheetsData {
  trend_data: ExcelData[];
  weekly_trend_data: ExcelData[];
  monthly_summary_data: ExcelData[];
  trend_columns: string[];
  weekly_trend_columns: string[];
  monthly_summary_columns: string[];
}

// Cache key for localStorage
const CACHE_KEY = 'total_notifications_data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

// Fetch BSE alerts data from the new database endpoint
const fetchBSEAlertsData = async (limit: number = 100, offset: number = 0): Promise<any> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  // Use relative path since frontend and backend are served from the same origin
  const API_BASE_URL = '';

  try {
    const response = await fetch(`${API_BASE_URL}/bse-alerts?limit=${limit}&offset=${offset}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch BSE alerts data: ${response.status} ${response.statusText}`);
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Received non-JSON response from server');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server is taking too long to respond (30 seconds elapsed)');
    }
    throw error;
  }
};

// Add a new function to fetch all BSE alerts data
const fetchAllBSEAlertsData = async (): Promise<any> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for larger requests
  
  // Use relative path since frontend and backend are served from the same origin
  const API_BASE_URL = '';

  try {
    // First, get the total count of records
    const countResponse = await fetch(`${API_BASE_URL}/bse-alerts?limit=1&offset=0`, {
      signal: controller.signal
    });
    
    if (!countResponse.ok) {
      throw new Error(`Failed to fetch BSE alerts count: ${countResponse.status} ${countResponse.statusText}`);
    }
    
    const countData = await countResponse.json();
    const totalCount = countData.count;
    
    // Now fetch all records in batches to avoid memory issues
    const batchSize = 1000;
    let allData: any[] = [];
    
    for (let offset = 0; offset < totalCount; offset += batchSize) {
      const response = await fetch(`${API_BASE_URL}/bse-alerts?limit=${batchSize}&offset=${offset}`, {
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch BSE alerts data: ${response.status} ${response.statusText}`);
      }
      
      const batchData = await response.json();
      allData = allData.concat(batchData.data);
    }
    
    clearTimeout(timeoutId);
    
    return {
      data: allData,
      count: totalCount
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server is taking too long to respond (30 seconds elapsed)');
    }
    throw error;
  }
};

// Transform BSE alerts data to match ExcelView format
const transformBSEDataForExcelView = (data: any[]) => {
  return data.map(item => ({
    "Name of Entity": item.entity_name || "Unknown Entity", // Using the actual EntityName from database
    "Link to Intimation": item.pdf_link, // Using the expected column name
    "Nature of Intimation": item.nature || "N/A", // Using the actual Nature from database
    "Summary of Intimation": item.summary, // Using the expected column name
    "Date": item.date_key
  }));
};

// Filter data to show only the latest month
const filterDataByLatestMonth = (data: any[]) => {
  if (!data || data.length === 0) return data;
  
  // Find the latest date in the data
  let latestDate: Date | null = null;
  data.forEach(item => {
    if (item.date_key) {
      try {
        const date = new Date(item.date_key);
        if (!latestDate || date > latestDate) {
          latestDate = date;
        }
      } catch (e) {
        console.error("Error parsing date:", item.date_key, e);
      }
    }
  });
  
  // If no valid dates found, return original data
  if (!latestDate) return data;
  
  // Filter data to only include records from the latest month
  const latestMonth = latestDate.getMonth();
  const latestYear = latestDate.getFullYear();
  
  return data.filter(item => {
    if (!item.date_key) return false;
    try {
      const itemDate = new Date(item.date_key);
      return itemDate.getMonth() === latestMonth && itemDate.getFullYear() === latestYear;
    } catch (e) {
      console.error("Error parsing date:", item.date_key, e);
      return false;
    }
  });
};

// Check if cached data is still valid
const isCacheValid = (cachedData: any) => {
  if (!cachedData || !cachedData.timestamp) return false;
  const now = Date.now();
  return (now - cachedData.timestamp) < CACHE_DURATION;
};

// Save data to cache
const saveToCache = (data: any) => {
  try {
    const cacheData = {
      ...data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.error('Failed to save to cache:', e);
  }
};

// Load data from cache
const loadFromCache = (): any => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (isCacheValid(parsed)) {
        return parsed;
      } else {
        // Remove expired cache
        localStorage.removeItem(CACHE_KEY);
      }
    }
  } catch (e) {
    console.error('Failed to load from cache:', e);
    // Remove corrupted cache
    localStorage.removeItem(CACHE_KEY);
  }
  return null;
};

const chartConfig = {
  total_entities: {
    label: "Total Notifications",
    color: "#6196FE",
  },
} satisfies ChartConfig;

const TotalNotifications = () => {
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [workbookData, setWorkbookData] = useState<CombinedWorkbookData | null>(null);
  const [specialSheetsData, setSpecialSheetsData] = useState<SpecialSheetsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [useCache, setUseCache] = useState<boolean>(true);

  // Handle view notification
  const handleViewNotification = (record: any): void => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  // Handle opening external link
  const handleOpenLink = (url: string): void => {
    if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Memoized data filtering function
  const filterData = useCallback((data: ExcelData[]) => {
    return data.filter(row => {
      // Check if any column has non-empty data
      const hasValidData = Object.values(row).some(value => {
        if (value === null || value === undefined) return false;
        const stringValue = String(value).trim();
        return stringValue !== '' && stringValue !== 'null' && stringValue !== 'undefined';
      });
      
      // Filter out rows where "Name of Entity" is "Total"
      const entityName = String(row["Name of Entity"] || "").trim();
      const isTotalEntity = entityName.toUpperCase() === "TOTAL";
      
      // Exclude rows where "Summary of Intimation" is "NIL"
      const summaryValue = String(row["Summary of Intimation"] || "").trim().toUpperCase();
      const isSummaryNil = summaryValue === "NIL" || summaryValue === "NILL" || summaryValue === "NULL";
      
      // Return true only if row has valid data, entity is not "Total", and summary is not NIL
      return hasValidData && !isTotalEntity && !isSummaryNil;
    });
  }, []);

  // Load workbook data on component mount with caching
  useEffect(() => {
    const loadWorkbookData = async () => {
      try {
        setLoading(true);
        setError(null);
       
        // Check cache first if enabled
        if (useCache) {
          const cachedData = loadFromCache();
          if (cachedData) {
            setWorkbookData(cachedData.workbookData);
            setSpecialSheetsData(cachedData.specialSheetsData);
            setLoading(false);
            return;
          }
        }
       
        // Fetch ALL BSE alerts data from the new endpoint
        const bseDataResponse = await fetchAllBSEAlertsData(); // Fetch all records
        const bseData = bseDataResponse.data;
        const totalNotificationsCount = bseDataResponse.count; // Get total count from API response
       
        // Transform data for ExcelView
        const transformedData = transformBSEDataForExcelView(bseData);
        
        // Apply filtering to remove invalid data
        const filteredData = filterData(transformedData);
        
        // Filter data to show only latest month
        const latestMonthData = filterDataByLatestMonth(filteredData);
        
        // Create mock workbook data structure for ExcelView
        const mockWorkbookData: CombinedWorkbookData = {
          file_name: "bse_alerts.db",
          sheets: ["DailyLogs"],
          combined_data: latestMonthData,
          count: totalNotificationsCount, // Total count from API response
          special_sheets_excluded: []
        };
        
        setWorkbookData(mockWorkbookData);
        
        // Save to cache with total count
        if (useCache) {
          saveToCache({
            workbookData: mockWorkbookData,
            specialSheetsData: null,
            totalCount: totalNotificationsCount
          });
        }
      } catch (err) {
        console.error("Error loading workbook data:", err);
        setError(err instanceof Error ? err.message : "Failed to load workbook data");
      } finally {
        setLoading(false);
      }
    };

    loadWorkbookData();
  }, [useCache]);

  // Add scroll to top effect
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <BSEAlertsDashboardLayout>
      {/* Notification Bar at top of page */}
      <NotificationBar />
      
      <div className="min-h-screen" style={{
        background: "#ffffff",
      }}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>
              Total Notifications
            </h1>
          </div>

          {/* Excel View Section with View Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.2 }}
            className="mb-8"
          >
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                  <p>Loading workbook data...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                <p>Error: {error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="mt-2"
                  style={{
                    backgroundColor: '#1E40AF',
                    color: 'white'
                  }}
                >
                  Retry
                </Button>
              </div>
            ) : workbookData ? (
              <ExcelView
                initialData={workbookData.combined_data}
                columns={["Name of Entity", "Link to Intimation", "Nature of Intimation", "Summary of Intimation", "Date"]}
                title="Total Notifications"
                onViewRow={(row, rowIndex) => {
                  handleViewNotification(row);
                }}
                columnWidths={{
                  "Date": "120px",
                  "Link to Intimation": "150px",
                  "Name of Entity": "minmax(150px, 1fr)",
                  "Nature of Intimation": "minmax(150px, 1fr)",
                  "Summary of Intimation": "minmax(200px, 2fr)"
                }}
                containerHeight="700px"
                enableDateRangeFilter={true} // Enable date range filter
              />
            ) : (
              <ExcelView
                initialData={[]}
                columns={["Name of Entity", "Link to Intimation", "Nature of Intimation", "Summary of Intimation", "Date"]}
                title="Total Notifications"
                onViewRow={(row, rowIndex) => {
                  handleViewNotification(row);
                }}
                columnWidths={{
                  "Date": "120px",
                  "Link to Intimation": "150px",
                  "Name of Entity": "minmax(150px, 1fr)",
                  "Nature of Intimation": "minmax(150px, 1fr)",
                  "Summary of Intimation": "minmax(200px, 2fr)"
                }}
                containerHeight="700px"
                enableDateRangeFilter={true} // Enable date range filter
              />
            )}
          </motion.div>

          {/* Data Analytics Display - REMOVED as per user request */}
        </div>
      </div>

      {/* Record Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto w-full" style={{ background: '#ffffff' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl " style={{ color: '#000000' }}>
              <FileText className="h-6 w-6" style={{ color: '#1E40AF' }} />
              Notification Details
            </DialogTitle>
            <DialogDescription style={{ color: '#000000' }}>
              Detailed information for the selected notification record
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-6 mt-4 w-full">
              {/* Entity Information */}
              <div className="grid grid-cols-1 gap-4 w-full">
                <Card style={{ background: '#ffffff', border: '2px solid #46798E', boxShadow: '0 4px 15px rgba(70, 121, 142, 0.2)' }}>
                  <CardHeader className="pb-3" style={{ background: '#46798E', borderRadius: '8px 8px 0 0' }}>
                    <CardTitle className="text-sm font-mono text-white">Entity Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-xs font-mono font-semibold" style={{ color: '#010741' }}>Details:</span>
                      <div className="mt-2 space-y-2">
                        {Object.entries(selectedRecord).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium" style={{ color: '#46798E' }}>{key}:</span>{" "}
                            <span style={{ color: '#010741' }}>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Section */}
              <Card style={{ background: '#ffffff' }} className="w-full">
                <CardHeader>
                  <CardTitle className="text-lg " style={{ color: '#1E40AF' }}>Summary of Intimation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none w-full">
                    <div 
                      className="text-sm leading-relaxed whitespace-pre-line p-4 rounded-lg w-full" 
                      style={{ 
                        background: '#ffffff',
                        border: '1px solid #1E40AF',
                        color: '#000000'
                      }}
                    >
                      {selectedRecord["Summary of Intimation"] || "No summary available"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t w-full" style={{ borderColor: 'rgba(0, 0, 0, 0.8)' }}>
                <div className="text-xs " style={{ color: '#000000' }}>
                  Record viewed at {new Date().toLocaleString()}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleOpenLink(selectedRecord["Link to Intimation"])}
                    className="flex items-center gap-2"
                    style={{
                      backgroundColor: 'rgba(30, 64, 175, 0.1)',
                      borderColor: 'rgba(30, 64, 175, 0.8)',
                      color: '#1E40AF'
                    }}
                  >
                    <ExternalLink size={16} />
                    Open Document
                  </Button>
                  <Button
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      backgroundColor: '#000000',
                      borderColor: '#000000',
                      color: 'white'
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </BSEAlertsDashboardLayout>
  );
};

export default TotalNotifications;