import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import ExcelView from '@/components/ui/ExcelView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';

interface ExcelDataRow {
  [key: string]: string | number;
}

interface ExcelDataLoaderProps {
  fileName: string;
  title: string;
  onDataLoaded?: (data: ExcelDataRow[]) => void;
}

const ExcelDataLoader = ({ fileName, title, onDataLoaded }: ExcelDataLoaderProps) => {
  const [data, setData] = useState<ExcelDataRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExcelData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Construct the file path
        const filePath = `/excel/${fileName}`;
        
        // Fetch the Excel file
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load ${fileName}: ${response.statusText}`);
        }
        
        // Get the file as array buffer
        const arrayBuffer = await response.arrayBuffer();
        
        // Parse the Excel file
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelDataRow[];
        
        setData(jsonData);
        if (onDataLoaded) {
          onDataLoaded(jsonData);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load Excel data';
        setError(errorMessage);
        console.error(`Error loading ${fileName}:`, err);
      } finally {
        setLoading(false);
      }
    };

    loadExcelData();
  }, [fileName, onDataLoaded]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Error Loading {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-red-500">
            <p>{error}</p>
          </div>
          <div className="mt-4 text-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Convert data to the format expected by ExcelView
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const formattedData = data.map((row, index) => {
    const formattedRow: ExcelDataRow = {};
    Object.keys(row).forEach(key => {
      formattedRow[key] = row[key];
    });
    return formattedRow;
  });

  return (
    <ExcelView
      initialData={formattedData}
      columns={columns}
      title={title}
      columnWidths={columns.reduce((acc, col) => {
        if (col === 'Date') {
          acc[col] = '120px';
        } else if (col.includes('Link') || col.includes('PDF')) {
          acc[col] = '150px';
        } else if (col.includes('Summary')) {
          acc[col] = 'minmax(200px, 2fr)';
        } else {
          acc[col] = 'minmax(150px, 1fr)';
        }
        return acc;
      }, {} as Record<string, string>)}
    />
  );
};

export default ExcelDataLoader;