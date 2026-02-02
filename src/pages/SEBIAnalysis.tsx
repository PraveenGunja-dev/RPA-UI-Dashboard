import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, FileText, Calendar, Link as LinkIcon, RefreshCw, ExternalLink } from 'lucide-react';
import SEBIAnalysisDashboardLayout from '@/components/layout/SEBIAnalysisDashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
// Import chart components
import SEBIMonthlyTrendChart from '@/components/charts/SEBIMonthlyTrendChart';
import SEBIWeeklyPieChart from '@/components/charts/SEBIWeeklyPieChart';
import SEBIDailyTrendChart from '@/components/charts/SEBIDailyTrendChart';
// Import Dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Import data processing utilities
import { processSEBIMonthlyData, processSEBIWeeklyData, processSEBIDailyData } from '@/utils/sebiDataProcessor';
import ExcelView from '@/components/ui/ExcelView';

// Define the SEBI data type
interface SEBIData {
  id: number;
  date_key: string;
  row_index: number;
  pdf_link: string;
  summary: string;
  inserted_at: string;
}

const SEBIAnalysis = () => {
  // Add scroll to top effect
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [sebiData, setSebiData] = useState<SEBIData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chart data states
  const [chartData, setChartData] = useState({
    monthly: [] as any[],
    weekly: [] as any[],
    daily: [] as any[],
  });

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SEBIData | null>(null);

  // Handle view button click
  const handleViewRecord = (item: SEBIData) => {
    setSelectedRecord(item);
    setIsModalOpen(true);
  };

  // Transform SEBI data for ExcelView (sort by date descending)
  const formatSEBIForExcel = (data: SEBIData[]): any[] => {
    // Sort data by date_key in descending order (most recent first)
    const sortedData = [...data].sort((a, b) => {
      return new Date(b.date_key).getTime() - new Date(a.date_key).getTime();
    });
    
    return sortedData.map((item, index) => ({
      'Date': item.date_key,
      'Row Index': item.row_index,
      'PDF Link': item.pdf_link,
      'Summary': item.summary
      // Removed ID field as requested
    }));
  };

  const fetchSEBIData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use relative path since frontend and backend are served from the same origin
      const response = await fetch(`/sebi-analysis-data`);
      if (!response.ok) {
        throw new Error(`Failed to fetch SEBI data: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      // Debug: Log fetched data
      // console.log('Fetched SEBI Data:', data);
      
      // Sort data by date_key in descending order (most recent first)
      const sortedData = data.data.sort((a: SEBIData, b: SEBIData) => {
        return new Date(b.date_key).getTime() - new Date(a.date_key).getTime();
      });
      
      setSebiData(sortedData);
      
      // Debug: Log sorted data
      // console.log('Sorted SEBI Data:', sortedData);
      
      // Process data for charts (only records with valid PDF links)
      const monthlyChartData = processSEBIMonthlyData(sortedData);
      const weeklyChartData = processSEBIWeeklyData(sortedData);
      const dailyChartData = processSEBIDailyData(sortedData);
      
      // Debug: Log chart data
      // console.log('Chart Data:', { monthlyChartData, weeklyChartData, dailyChartData });
      
      setChartData({
        monthly: monthlyChartData,
        weekly: weeklyChartData,
        daily: dailyChartData
      });
    } catch (err) {
      console.error('Error fetching SEBI data:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSEBIData();
  }, []);

  if (loading) {
    return (
      <SEBIAnalysisDashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold">SEBI Analysis</h1>
              <p className="text-muted-foreground">Securities and Exchange Board of India market regulation analysis</p>
            </div>
          </div>
          
          {/* Chart Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-2" />
                  <Skeleton className="h-4 w-4/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SEBIAnalysisDashboardLayout>
    );
  }

  if (error) {
    return (
      <SEBIAnalysisDashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold">SEBI Analysis</h1>
              <p className="text-muted-foreground">Securities and Exchange Board of India market regulation analysis</p>
            </div>
          </div>
          
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-2xl">Error Loading Data</CardTitle>
              <CardDescription>
                Unable to fetch SEBI analysis data
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4 text-red-500">
                {error}
              </p>
              <Button onClick={fetchSEBIData} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </SEBIAnalysisDashboardLayout>
    );
  }

  return (
    <SEBIAnalysisDashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">SEBI Analysis</h1>
            <p className="text-muted-foreground">Securities and Exchange Board of India market regulation analysis</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {sebiData.length} records (with valid PDF links)
            </div>
            <Button onClick={fetchSEBIData} variant="outline" size="sm" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SEBIMonthlyTrendChart data={chartData.monthly} />
          <SEBIWeeklyPieChart data={chartData.weekly} />
          <SEBIDailyTrendChart data={chartData.daily} />
        </div>

        {/* Excel View Section */}
        <div className="mb-8">
          <ExcelView  
            initialData={formatSEBIForExcel(sebiData)}
            title="SEBI Analysis Data"
            columns={['Date', 'Row Index', 'PDF Link', 'Summary']}
            onViewRow={(row, rowIndex) => {
              // Find the original item from sebiData using the date and row index
              const item = sebiData.find(item => 
                item.date_key === row['Date'] && 
                item.row_index === row['Row Index']
              );
              if (item) {
                handleViewRecord(item);
              }
            }}
            columnWidths={{
              'Date': '120px',
              'Row Index': '100px',
              'PDF Link': '150px',
              'Summary': 'minmax(200px, 2fr)'
            }}
          />
        </div>

        {sebiData.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <FileText className="h-12 w-12 text-blue-500" />
              </div>
              <CardTitle className="text-2xl">No SEBI Data Available</CardTitle>
              <CardDescription>
                No SEBI analysis data found in the database
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">
                Check back later for updated SEBI regulatory information.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {sebiData.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {item.date_key}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        Record #{item.row_index}
                      </div>
                    </div>
                    <CardDescription>
                      Added on {new Date(item.inserted_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Summary:
                        </h3>
                        {item.summary === 'NIL' ? (
                          <p className="text-muted-foreground italic">No summary available</p>
                        ) : (
                          <p className="whitespace-pre-wrap">{item.summary}</p>
                        )}
                      </div>
                      
                      {item.pdf_link && item.pdf_link !== 'NIL' && (
                        <div>
                          <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" />
                            Document:
                          </h3>
                          <a 
                            href={item.pdf_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <LinkIcon className="h-4 w-4" />
                            View PDF Document
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Record Details Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-xl" style={{ color: '#BD3861' }}>
                    <FileText className="h-6 w-6" />
                    SEBI Record Details
                  </DialogTitle>
                  <DialogDescription>
                    Detailed information for the selected SEBI record
                  </DialogDescription>
                </DialogHeader>
                
                {selectedRecord && (
                  <div className="space-y-6 mt-4">
                    {/* Record Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg" style={{ color: '#BD3861' }}>Record Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Date:</span>
                            <span>{selectedRecord.date_key}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Row Index:</span>
                            <span>{selectedRecord.row_index}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Record ID:</span>
                            <span>{selectedRecord.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Added On:</span>
                            <span>{new Date(selectedRecord.inserted_at).toLocaleString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Summary Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg" style={{ color: '#BD3861' }}>Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none">
                            <div 
                              className="text-sm leading-relaxed whitespace-pre-wrap p-4 rounded-lg"
                              style={{ 
                                backgroundColor: 'rgba(189, 56, 97, 0.1)',
                                border: '1px solid rgba(189, 56, 97, 0.3)',
                                color: '#000000'
                              }}
                            >
                              {selectedRecord.summary === 'NIL' ? 'No summary available' : selectedRecord.summary}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* PDF Link */}
                    {selectedRecord.pdf_link && selectedRecord.pdf_link !== 'NIL' && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg" style={{ color: '#BD3861' }}>Document</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <a 
                            href={selectedRecord.pdf_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View PDF Document
                          </a>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}>
                      <Button
                        onClick={() => setIsModalOpen(false)}
                        style={{
                          backgroundColor: '#BD3861',
                          borderColor: '#BD3861',
                          color: 'white'
                        }}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </SEBIAnalysisDashboardLayout>
  );
};

export default SEBIAnalysis;