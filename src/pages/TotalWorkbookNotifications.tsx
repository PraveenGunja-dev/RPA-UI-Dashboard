import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, RefreshCw, AlertCircle } from "lucide-react";
import BSEAlertsDashboardLayout from "@/components/layout/BSEAlertsDashboardLayout";
import NotificationBar from "@/components/ui/NotificationBar";
import ExcelView from "@/components/ui/ExcelView";

// Define types
interface ExcelData {
  [key: string]: string | number;
}

interface CombinedWorkbookData {
  file_name: string;
  sheets: string[];
  combined_data: ExcelData[];
  count: number;
}

// Fetch combined workbook data from API
const fetchCombinedWorkbookData = async (fileName: string): Promise<CombinedWorkbookData> => {
  const response = await fetch(`/combined-workbook-data/${fileName}`);
  if (!response.ok) {
    throw new Error("Failed to fetch combined workbook data");
  }
  return response.json();
};

const TotalWorkbookNotifications = () => {
  const [fileName, setFileName] = useState<string>("2025-08.xlsx");
  const [showExcelView, setShowExcelView] = useState<boolean>(false);
  
  const { data, isLoading, error, refetch } = useQuery<CombinedWorkbookData, Error>({
    queryKey: ["combinedWorkbookData", fileName],
    queryFn: () => fetchCombinedWorkbookData(fileName),
    enabled: false, // Don't fetch automatically, only when user clicks load
  });

  // Handle loading the combined workbook data
  const handleLoadWorkbook = () => {
    refetch();
  };

  // Reset view when file name changes
  const handleFileNameChange = (newFileName: string) => {
    setFileName(newFileName);
    setShowExcelView(false);
  };

  return (
    <BSEAlertsDashboardLayout>
      <NotificationBar />
      
      <div className="min-h-screen p-8" style={{ background: "#FFFFFF" }}>
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <FileSpreadsheet className="h-8 w-8" style={{ color: "#1E40AF" }} />
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ color: "#000000" }}>
                TOTAL NOTIFICATIONS
              </CardTitle>
            </div>
            <CardDescription className="text-lg" style={{ color: '#000000' }}>
              Combined data from all Excel workbook sheets
            </CardDescription>
          </CardHeader>
        </Card>
        
        {!showExcelView ? (
          <Card style={{ background: "#FFFFFF", border: "2px solid #1E40AF" }}>
            <CardHeader>
              <CardTitle style={{ color: '#000000' }}>Load Combined Workbook Data</CardTitle>
              <CardDescription>
                Enter the name of your Excel workbook to load combined data from all sheets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="file-name" className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Excel File Name
                  </label>
                  <input
                    id="file-name"
                    type="text"
                    value={fileName}
                    onChange={(e) => handleFileNameChange(e.target.value)}
                    className="w-full p-2 border rounded"
                    style={{ borderColor: '#1E40AF', background: '#FFFFFF' }}
                    placeholder="Enter file name (e.g., 2025-08.xlsx)"
                  />
                  <p className="text-sm mt-1" style={{ color: '#666666' }}>
                    Default file is 2025-08.xlsx. The file should be located in the backend/public/excel directory
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleLoadWorkbook} 
                    disabled={isLoading}
                    className="flex items-center gap-2"
                    style={{
                      backgroundColor: '#1E40AF',
                      color: 'white'
                    }}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Loading...' : 'Load Combined Data'}
                  </Button>
                  
                  {error && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded">
                      <AlertCircle className="h-4 w-4" />
                      <span>Error: {error.message}</span>
                    </div>
                  )}
                </div>
                
                {data && (
                  <div className="mt-6 p-4 border rounded" style={{ borderColor: '#1E40AF' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#000000' }}>Workbook Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">File Name</p>
                        <p className="font-medium" style={{ color: '#000000' }}>{data.file_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Number of Sheets</p>
                        <p className="font-medium" style={{ color: '#000000' }}>{data.sheets.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Records</p>
                        <p className="font-medium" style={{ color: '#000000' }}>{data.count}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button 
                        onClick={() => setShowExcelView(true)}
                        style={{
                          backgroundColor: '#1E40AF',
                          color: 'white'
                        }}
                      >
                        View Combined Data
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          data && (
            <ExcelView 
              initialData={data.combined_data}
              title="Total Notifications"
              onClose={() => setShowExcelView(false)}
              columns={["Name of Entity", "Link to Intimation", "Nature of Intimation", "Summary of Intimation", "Date"]}
              columnWidths={{
                "Date": "120px",
                "Link to Intimation": "150px",
                "Name of Entity": "minmax(150px, 1fr)",
                "Nature of Intimation": "minmax(150px, 1fr)",
                "Summary of Intimation": "minmax(200px, 2fr)"
              }}
            />
          )
        )}
      </div>
    </BSEAlertsDashboardLayout>
  );
};

export default TotalWorkbookNotifications;