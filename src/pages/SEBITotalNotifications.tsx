import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Activity, Bell, TrendingUp, FileText, Loader2, AlertCircle } from "lucide-react";
import SEBIAnalysisDashboardLayout from "@/components/layout/SEBIAnalysisDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ExcelView from "../components/ui/ExcelView";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NotificationBar from "@/components/ui/NotificationBar";

// Define types for SEBI data
interface SEBIExcelSummary {
  id: number;
  date_key: string;
  row_index: number;
  pdf_link: string;
  summary: string;
  inserted_at: string;
}

// Cache key for localStorage
const CACHE_KEY = 'sebi_total_notifications_data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

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
    localStorage.removeItem(CACHE_KEY);
  }
  return null;
};

// Fetch SEBI data from API with timeout
const fetchSEBIData = async (limit: number = 100, offset: number = 0): Promise<any> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  // Use relative path since frontend and backend are served from the same origin
  const API_BASE_URL = '';

  try {
    const response = await fetch(`${API_BASE_URL}/sebi-analysis-data?limit=${limit}&offset=${offset}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
   
    if (!response.ok) {
      throw new Error(`Failed to fetch SEBI data: ${response.status} ${response.statusText}`);
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

// Transform SEBI data to match ExcelView format
const transformSEBIDataForExcelView = (data: SEBIExcelSummary[]) => {
  return data
    .filter(item => item.pdf_link !== 'NIL' && item.summary !== 'NIL') // Filter out NIL records
    .map(item => ({
      "Date": item.date_key,
      "PDF Link": item.pdf_link,
      "Summary": item.summary
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

const SEBITotalNotifications = () => {
  // Add scroll to top effect
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [sebiData, setSEBIData] = useState<any[] | null>(null);
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

  // Handle refresh with optimizations
  const handleRefresh = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
     
      // Force refresh by disabling cache temporarily
      setUseCache(false);
     
      // Fetch SEBI data from the new endpoint
      const sebiDataResponse = await fetchSEBIData(1000, 0); // Fetch all valid records
      const sebiData = sebiDataResponse.data;
      const totalNotificationsCount = sebiDataResponse.count; // Get total count from API response
     
      // Transform data for ExcelView
      const transformedData = transformSEBIDataForExcelView(sebiData);
      
      // Filter data to show only latest month
      const filteredData = filterDataByLatestMonth(transformedData);
      
      setSEBIData(filteredData);
     
      // Save to cache with total count
      saveToCache({
        sebiData: filteredData,
        totalCount: totalNotificationsCount
      });
    } catch (err) {
      console.error("Error refreshing SEBI data:", err);
      setError(err instanceof Error ? err.message : "Failed to refresh SEBI data");
    } finally {
      setLoading(false);
      // Re-enable cache
      setUseCache(true);
    }
  }, []);

  // Load SEBI data on component mount with caching
  useEffect(() => {
    const loadSEBIData = async () => {
      try {
        setLoading(true);
        setError(null);
       
        // Check cache first if enabled
        if (useCache) {
          const cachedData = loadFromCache();
          if (cachedData) {
            setSEBIData(cachedData.sebiData);
            setLoading(false);
            return;
          }
        }
       
        // Fetch SEBI data from the new endpoint
        const sebiDataResponse = await fetchSEBIData(1000, 0); // Fetch all valid records
        const sebiData = sebiDataResponse.data;
        const totalNotificationsCount = sebiDataResponse.count; // Get total count from API response
       
        // Filter out NIL records
        const filteredData = sebiData.filter((item: SEBIExcelSummary) => 
          item.pdf_link !== 'NIL' && item.summary !== 'NIL'
        );
       
        // Transform data for ExcelView
        const transformedData = transformSEBIDataForExcelView(filteredData);
        
        // Filter data to show only latest month
        const latestMonthData = filterDataByLatestMonth(transformedData);
        
        setSEBIData(latestMonthData);
       
        // Save to cache with total count
        if (useCache) {
          saveToCache({
            sebiData: latestMonthData,
            totalCount: totalNotificationsCount
          });
        }
      } catch (err) {
        console.error("Error loading SEBI data:", err);
        setError(err instanceof Error ? err.message : "Failed to load SEBI data");
      } finally {
        setLoading(false);
      }
    };

    loadSEBIData();
  }, [useCache]);

  if (loading && !sebiData) {
    return (
      <SEBIAnalysisDashboardLayout>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: "#BD3861" }} />
            <p className="text-lg" style={{ color: "#000000" }}>Loading SEBI Notifications data...</p>
          </div>
        </div>
      </SEBIAnalysisDashboardLayout>
    );
  }

  if (error && !sebiData) {
    return (
      <SEBIAnalysisDashboardLayout>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
          <div className="text-center p-6 max-w-md">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: "#EF4444" }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: "#000000" }}>Error Loading SEBI Notifications Data</h2>
            <p className="mb-4" style={{ color: "#000000" }}>{error}</p>
            <Button
              onClick={handleRefresh}
              style={{
                backgroundColor: '#BD3861',
                borderColor: '#BD3861',
                color: 'white'
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </SEBIAnalysisDashboardLayout>
    );
  }

  return (
    <SEBIAnalysisDashboardLayout>
      {/* Notification Bar at top of page */}
      <NotificationBar />
      
      <div className="min-h-screen" style={{
        background: "#ffffff",
      }}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>
              SEBI Analysis
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
                  <p>Loading SEBI data...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                <p>Error: {error}</p>
                <Button 
                  onClick={handleRefresh} 
                  className="mt-2"
                  style={{
                    backgroundColor: '#BD3861',
                    color: 'white'
                  }}
                >
                  Retry
                </Button>
              </div>
            ) : sebiData ? (
              <ExcelView
                initialData={sebiData}
                columns={["Date", "PDF Link", "Summary"]}
                title="SEBI Analysis"
                onViewRow={(row, rowIndex) => {
                  handleViewNotification(row);
                }}
                columnWidths={{
                  'Date': '120px',
                  'PDF Link': '150px',
                  'Summary': 'minmax(200px, 2fr)'
                }}
                containerHeight="700px"
              />
            ) : (
              <ExcelView
                initialData={[]}
                columns={["Date", "PDF Link", "Summary"]}
                title="SEBI Analysis"
                onViewRow={(row, rowIndex) => {
                  handleViewNotification(row);
                }}
                columnWidths={{
                  'Date': '120px',
                  'PDF Link': '150px',
                  'Summary': 'minmax(200px, 2fr)'
                }}
                containerHeight="700px"
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
                <Card style={{ background: '#ffffff', border: '2px solid #46798E', boxShadow: '0 4px 15px rgba(70, 121, 142, 0.2)' }} className="w-full">
                  <CardHeader className="pb-3" style={{ background: '#46798E', borderRadius: '8px 8px 0 0' }}>
                    <CardTitle className="text-sm font-mono text-white">Notification Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-xs font-mono font-semibold" style={{ color: '#010741' }}>Details:</span>
                      <div className="mt-2 space-y-2">
                        <div className="text-sm">
                          <span className="font-medium" style={{ color: '#46798E' }}>Date:</span>{" "}
                          <span style={{ color: '#010741' }}>{selectedRecord["Date"] || "N/A"}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium" style={{ color: '#46798E' }}>PDF Link:</span>{" "}
                          <span style={{ color: '#010741' }}>{selectedRecord["PDF Link"] || "N/A"}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium" style={{ color: '#46798E' }}>Summary:</span>{" "}
                          <span style={{ color: '#010741' }}>{selectedRecord["Summary"] || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Section */}
              <Card style={{ background: '#ffffff' }} className="w-full">
                <CardHeader>
                  <CardTitle className="text-lg " style={{ color: '#1E40AF' }}>Summary</CardTitle>
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
                      {selectedRecord["Summary"] || "No summary available"}
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
                    onClick={() => handleOpenLink(selectedRecord["PDF Link"])}
                    className="flex items-center gap-2"
                    style={{
                      backgroundColor: 'rgba(30, 64, 175, 0.1)',
                      borderColor: 'rgba(30, 64, 175, 0.8)',
                      color: '#1E40AF'
                    }}
                  >
                    <FileText size={16} />
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
    </SEBIAnalysisDashboardLayout>
  );
};

export default SEBITotalNotifications;