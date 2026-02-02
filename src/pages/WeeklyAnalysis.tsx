import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { RefreshCw, PieChart } from "lucide-react";
import BSEAlertsDashboardLayout from "@/components/layout/BSEAlertsDashboardLayout";
import WeeklyAnalysisPieChart from "@/components/charts/WeeklyAnalysisPieChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NotificationBar from "@/components/ui/NotificationBar";

// Define types
interface WeeklyData {
  week: string;
  entity_name: string;
  total_notifications: number;
}

interface AllNotificationsData {
  files_processed: string[];
  sheets_processed: string[];
  special_sheets_excluded: string[];
  combined_data: Array<{ [key: string]: any }>;
  count: number;
}

// Fetch all notifications data from API
const fetchAllNotificationsData = async (): Promise<AllNotificationsData> => {
  // Use relative path since frontend and backend are served from the same origin
  const API_BASE_URL = '';
  
  const response = await fetch(`${API_BASE_URL}/all-notifications`);
  if (!response.ok) {
    throw new Error("Failed to fetch all notifications data");
  }
  return response.json();
};

// Process data for weekly analysis
const processWeeklyData = (data: AllNotificationsData): WeeklyData[] => {
  // Group data by week (using Sheet_Date as week identifier)
  const weeklyMap: { [key: string]: { [entity: string]: number } } = {};
  
  data.combined_data.forEach(item => {
    // Skip items from special sheets that should be excluded
    const sheetName = (item.Sheet_Date || "").toLowerCase();
    const specialSheets = ['trend', 'weekly trend', 'monthly summary'];
    if (specialSheets.includes(sheetName)) {
      return; // Skip this item
    }
    
    const week = item.Sheet_Date || "Unknown";
    const entity = item["Name of Entity"] || "Unknown Entity";
    
    if (!weeklyMap[week]) {
      weeklyMap[week] = {};
    }
    
    if (!weeklyMap[week][entity]) {
      weeklyMap[week][entity] = 0;
    }
    
    weeklyMap[week][entity] += 1;
  });
  
  // Convert to array format
  const result: WeeklyData[] = [];
  Object.keys(weeklyMap).forEach(week => {
    Object.keys(weeklyMap[week]).forEach(entity => {
      result.push({
        week,
        entity_name: entity,
        total_notifications: weeklyMap[week][entity]
      });
    });
  });
  
  return result;
};

const WeeklyAnalysis = () => {
  const { data, isLoading, error, refetch } = useQuery<AllNotificationsData, Error>({
    queryKey: ["allNotifications"],
    queryFn: fetchAllNotificationsData,
  });
  
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  
  useEffect(() => {
    if (data) {
      const processedData = processWeeklyData(data);
      setWeeklyData(processedData);
    }
  }, [data]);

  return (
    <BSEAlertsDashboardLayout>
      <NotificationBar />
      
      <div className="min-h-screen p-8" style={{ background: "#FFFFFF" }}>
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <PieChart className="h-8 w-8" style={{ color: "#7E659E" }} />
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ color: "#000000" }}>
                WEEKLY ANALYSIS
              </CardTitle>
            </div>
            <CardDescription className="text-lg" style={{ color: '#000000' }}>
              Distribution of notifications by entity across weeks
            </CardDescription>
          </CardHeader>
        </Card>
        
        <div className="flex justify-end mb-6">
          <Button 
            onClick={() => refetch()} 
            disabled={isLoading}
            className="flex items-center gap-2"
            style={{
              backgroundColor: '#7E659E',
              color: 'white'
            }}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
        
        {error && (
          <Card className="mb-6" style={{ background: "#FFFFFF", border: "2px solid #7E659E" }}>
            <CardContent className="p-6">
              <div className="text-red-500 font-medium">
                Error: {error.message}
              </div>
            </CardContent>
          </Card>
        )}
        
        {isLoading ? (
          <Card style={{ background: "#FFFFFF", border: "2px solid #7E659E" }}>
            <CardContent className="p-6">
              <div className="flex justify-center items-center h-64">
                <div className="text-lg" style={{ color: '#000000' }}>
                  Loading weekly analysis data...
                </div>
              </div>
            </CardContent>
          </Card>
        ) : weeklyData.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2 }}
          >
            <WeeklyAnalysisPieChart data={weeklyData} />
          </motion.div>
        ) : (
          <Card style={{ background: "#FFFFFF", border: "2px solid #7E659E" }}>
            <CardContent className="p-6">
              <div className="text-center" style={{ color: '#000000' }}>
                No data available for weekly analysis
              </div>
            </CardContent>
          </Card>
        )}
        
        {data && (
          <Card className="mt-8" style={{ background: "#FFFFFF", border: "2px solid #7E659E" }}>
            <CardHeader>
              <CardTitle style={{ color: '#000000' }}>Data Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Files Processed</p>
                  <p className="font-medium" style={{ color: '#000000' }}>{data.files_processed.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sheets Processed</p>
                  <p className="font-medium" style={{ color: '#000000' }}>{data.sheets_processed.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="font-medium" style={{ color: '#000000' }}>{data.count}</p>
                </div>
              </div>
              
              {data.special_sheets_excluded.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Special Sheets Excluded</p>
                  <ul className="list-disc pl-5 mt-1">
                    {data.special_sheets_excluded.map((sheet, index) => (
                      <li key={index} className="text-sm" style={{ color: '#000000' }}>{sheet}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </BSEAlertsDashboardLayout>
  );
};

export default WeeklyAnalysis;