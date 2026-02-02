import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, RefreshCw, AlertCircle } from "lucide-react";
import BSEAlertsDashboardLayout from "@/components/layout/BSEAlertsDashboardLayout";
import WorkbookView from "@/components/ui/WorkbookView";
import NotificationBar from "@/components/ui/NotificationBar";
import { hasRole, isAuthenticated } from "@/utils/adminAuth";

// Define types
interface ExcelData {
  [key: string]: string | number;
}

interface DateSheetData {
  date: string;
  data: ExcelData[];
  count: number;
}

interface WorkbookData {
  file_name: string;
  sheets: string[];
  data_by_date: Record<string, DateSheetData>;
}

// Fetch workbook data from API
const fetchWorkbookData = async (fileName: string): Promise<WorkbookData> => {
  const response = await fetch(`/workbook-data/${fileName}`);
  if (!response.ok) {
    throw new Error("Failed to fetch workbook data");
  }
  return response.json();
};

const WorkbookData = () => {
  const [fileName, setFileName] = useState<string>("2025-08.xlsx");
  const [showWorkbookView, setShowWorkbookView] = useState<boolean>(false);

  const { data, isLoading, error, refetch } = useQuery<WorkbookData, Error>({
    queryKey: ["workbookData", fileName],
    queryFn: () => fetchWorkbookData(fileName),
    enabled: false, // Don't fetch automatically, only when user clicks load
  });

  // Handle loading the workbook data
  const handleLoadWorkbook = () => {
    refetch();
  };

  // Check authorization
  const isAuthorized = hasRole('admin') || hasRole('bse_manager');
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    setIsLogged(isAuthenticated());
    setShowWorkbookView(false);
  }, [fileName]);

  return (
    <BSEAlertsDashboardLayout>
      <NotificationBar />

      <div className="min-h-screen p-8" style={{ background: "#FFFFFF" }}>
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <FileSpreadsheet className="h-8 w-8" style={{ color: "#1E40AF" }} />
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ color: "#000000" }}>
                WORKBOOK DATA
              </CardTitle>
            </div>
            <CardDescription className="text-lg" style={{ color: '#000000' }}>
              View and manage data from Excel workbooks with date-named sheets
            </CardDescription>
          </CardHeader>
        </Card>

        {!isAuthorized ? (
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0">
              <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                <AlertCircle className="h-5 w-5" />
                <p>You do not have the required permissions to view or manage workbook data. Please contact an administrator.</p>
              </div>
            </CardHeader>
          </Card>
        ) : !showWorkbookView ? (
          <Card style={{ background: "#FFFFFF", border: "2px solid #1E40AF" }}>
            <CardHeader>
              <CardTitle style={{ color: '#000000' }}>Load Workbook Data</CardTitle>
              <CardDescription>
                Enter the name of your Excel workbook to load data from all date-named sheets
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
                    onChange={(e) => setFileName(e.target.value)}
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
                    {isLoading ? 'Loading...' : 'Load Workbook'}
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
                        <p className="text-sm text-gray-600">Sheet Names</p>
                        <p className="font-medium" style={{ color: '#000000' }}>{data.sheets.join(', ')}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        onClick={() => setShowWorkbookView(true)}
                        style={{
                          backgroundColor: '#1E40AF',
                          color: 'white'
                        }}
                      >
                        View Data
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          data && (
            <WorkbookView
              workbookData={data}
              title={`Workbook: ${data.file_name}`}
              onClose={() => setShowWorkbookView(false)}
            />
          )
        )}
      </div>
    </BSEAlertsDashboardLayout>
  );
};

export default WorkbookData;