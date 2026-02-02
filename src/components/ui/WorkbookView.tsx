import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Upload, 
  Calendar,
  FileSpreadsheet,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';

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

interface WorkbookViewProps {
  workbookData: WorkbookData;
  title?: string;
  onClose?: () => void;
}

const WorkbookView = ({ 
  workbookData,
  title = 'Workbook Data',
  onClose
}: WorkbookViewProps) => {
  const [selectedDate, setSelectedDate] = useState<string>(workbookData.sheets[0] || '');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  
  // Get data for selected date
  const selectedData = workbookData.data_by_date[selectedDate] || { date: selectedDate, data: [], count: 0 };
  const columns = selectedData.data.length > 0 ? Object.keys(selectedData.data[0]) : [];
  
  // Apply filters
  const filteredData = selectedData.data.filter(row => {
    return Object.keys(filters).every(column => {
      if (!filters[column]) return true;
      const cellValue = String(row[column] || '').toLowerCase();
      return cellValue.includes(filters[column].toLowerCase());
    });
  });
  
  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
  
  // Handle filter change
  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };
  
  // Navigation
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Export to Excel
  const exportToExcel = (): void => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    
    // Set column widths based on content
    const columnWidths = columns.map((col) => {
      const maxLength = Math.max(
        col.length,
        ...filteredData.map(row => String(row[col] || '').length)
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    worksheet['!cols'] = columnWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, selectedDate);
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_${selectedDate}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={onClose ? "fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4" : ""}
      onClick={onClose ? (e) => e.target === e.currentTarget && onClose?.() : undefined}
    >
      <Card className={onClose ? "w-full max-w-7xl max-h-[90vh] overflow-hidden" : "w-full overflow-hidden"} style={{
        background: "#ffffff",
        boxShadow: "none",
        border: "1px solid rgba(97, 150, 254, 0.3)"
      }}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-6 w-6" style={{ color: '#6196FE' }} />
              <CardTitle className="text-xl font-semibold" style={{ color: '#301B89' }}>
                {title} - {selectedDate}
              </CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Excel Controls */}
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: 'rgba(97, 150, 254, 0.1)',
                  borderColor: 'rgba(97, 150, 254, 0.3)',
                  color: '#6196FE'
                }}
              >
                <Download size={14} />
                Export
              </Button>
              
              {onClose && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="flex items-center gap-2"
                >
                  <X size={14} />
                </Button>
              )}
            </div>
          </div>
          
          {/* Date Selection */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm font-medium" style={{ color: '#301B89' }}>Select Date:</span>
            <select
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              className="p-2 border rounded text-sm"
              style={{ 
                borderColor: '#6196FE', 
                background: '#FFFFFF',
                color: '#301B89'
              }}
            >
              {workbookData.sheets.map((sheet) => (
                <option key={sheet} value={sheet}>
                  {sheet}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className={`overflow-auto ${onClose ? 'max-h-[calc(90vh-250px)]' : 'max-h-[500px]'}`}>
            {columns.length > 0 && (
              <div className="grid gap-0 border" style={{
                gridTemplateColumns: `repeat(${columns.length}, minmax(150px, 1fr))`,
                borderColor: 'rgba(97, 150, 254, 0.2)'
              }}>
                {/* Header Row */}
                {columns.map((column) => (
                  <div 
                    key={column}
                    className="bg-gray-100 p-2 border-r text-xs font-semibold"
                    style={{ 
                      borderColor: 'rgba(97, 150, 254, 0.2)',
                      color: '#301B89'
                    }}
                  >
                    {column}
                  </div>
                ))}
                
                {/* Filter Row */}
                {columns.map((column) => (
                  <div 
                    key={`filter-${column}`}
                    className="bg-gray-50 p-1 border-r border-b text-xs"
                    style={{ borderColor: 'rgba(97, 150, 254, 0.2)' }}
                  >
                    <Input
                      type="text"
                      placeholder={`Filter ${column}`}
                      value={filters[column] || ''}
                      onChange={(e) => handleFilterChange(column, e.target.value)}
                      className="h-6 text-xs border-none p-1"
                      style={{ backgroundColor: 'rgba(97, 150, 254, 0.05)' }}
                    />
                  </div>
                ))}
                
                {/* Data Rows */}
                {paginatedData.map((row, rowIndex) => (
                  <React.Fragment key={rowIndex}>
                    {columns.map((column) => (
                      <div
                        key={`${rowIndex}-${column}`}
                        className="p-1 border-r border-b text-xs"
                        style={{ borderColor: 'rgba(97, 150, 254, 0.2)' }}
                      >
                        <div className="text-xs p-1 min-h-[24px] flex items-center">
                          <span className="truncate" title={String(row[column] || '')}>
                            {String(row[column] || '')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            )}
            
            {filteredData.length === 0 && (
              <div className="p-8 text-center" style={{ color: '#301B89' }}>
                <p>No data available for {selectedDate}</p>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: 'rgba(97, 150, 254, 0.2)' }}>
              <div className="text-sm" style={{ color: '#301B89' }}>
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                  style={{
                    backgroundColor: 'rgba(97, 150, 254, 0.1)',
                    borderColor: 'rgba(97, 150, 254, 0.3)',
                    color: '#6196FE'
                  }}
                >
                  <ChevronLeft size={14} />
                  Previous
                </Button>
                
                <span className="text-sm" style={{ color: '#301B89' }}>
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                  style={{
                    backgroundColor: 'rgba(97, 150, 254, 0.1)',
                    borderColor: 'rgba(97, 150, 254, 0.3)',
                    color: '#6196FE'
                  }}
                >
                  Next
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WorkbookView;