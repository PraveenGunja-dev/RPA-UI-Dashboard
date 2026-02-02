import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Upload,
  Plus,
  Edit3,
  FileSpreadsheet,
  X,
  ExternalLink,
  Eye,
  Calendar as CalendarIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ExcelData {
  [key: string]: string | number;
}

import { hasRole } from "@/utils/adminAuth";

// Date range type
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface ExcelViewProps {
  initialData?: ExcelData[];
  columns?: string[];
  title?: string;
  onClose?: () => void;
  onViewRow?: (row: ExcelData, rowIndex: number) => void;
  initializeWithEmptyRows?: boolean; // Add this new prop
  columnWidths?: Record<string, string>; // Add custom column widths prop
  rowsPerPage?: number; // Add custom rows per page prop
  containerHeight?: string; // Add custom container height prop
  enableDateRangeFilter?: boolean; // Add date range filter prop
  onDateRangeChange?: (dateRange: DateRange) => void; // Callback for date range changes
  initialDateRange?: DateRange; // Initial date range
  canEdit?: boolean; // New prop to explicitly allow editing
}

const ExcelView = ({
  initialData = [],
  columns = ['Date', 'PDF Link', 'Summary'],
  title = 'Excel View',
  onClose,
  onViewRow,
  initializeWithEmptyRows = false, // Default to false to prevent empty rows
  columnWidths = {}, // Default to empty object
  rowsPerPage: customRowsPerPage = 100, // Custom rows per page prop, default to 100
  containerHeight = '500px', // Custom container height prop, default to 500px
  enableDateRangeFilter = false, // Date range filter prop
  onDateRangeChange, // Callback for date range changes
  initialDateRange, // Initial date range
  canEdit: explicitCanEdit
}: ExcelViewProps) => {
  const [data, setData] = useState<ExcelData[]>(initialData);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Use global admin status or explicit prop
  const isAdmin = useMemo(() => explicitCanEdit ?? hasRole('admin'), [explicitCanEdit]);

  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage] = useState<number>(customRowsPerPage); // Use custom rows per page
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange || { from: undefined, to: undefined }); // Date range state
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false); // Calendar open state
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle filter change
  const handleFilterChange = useCallback((column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1); // Reset to first page when clearing filters
  }, []);

  // Handle date range selection
  const handleDateRangeSelect = (range: DateRange | undefined): void => {
    if (range) {
      setDateRange(range);
      if (onDateRangeChange) {
        onDateRangeChange(range);
      }
      if (range.from && range.to) {
        setIsCalendarOpen(false);
      }
    }
  };

  // Clear date range filter
  const clearDateRange = (): void => {
    const clearedRange = { from: undefined, to: undefined };
    setDateRange(clearedRange);
    if (onDateRangeChange) {
      onDateRangeChange(clearedRange);
    }
  };

  // Format date range for display
  const getDateRangeText = (): string => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`;
    } else if (dateRange.from) {
      return `From ${format(dateRange.from, "MMM dd")}`;
    } else if (dateRange.to) {
      return `To ${format(dateRange.to, "MMM dd")}`;
    }
    return "Select date range";
  };

  // Check for admin status in localStorage on component mount
  useEffect(() => {
    // Legacy check removed as we now use global shared auth
  }, []);

  // Calculate column widths based on content
  // This function is no longer needed as we're using CSS grid with minmax
  // const calculateColumnWidths = useCallback(() => {
  // }, []);

  // Set initial column widths

  // Recalculate column widths when data or columns change (with debounce)

  // Initialize with empty rows if no data provided AND initializeWithEmptyRows is true
  useEffect(() => {
    if (data.length === 0 && initialData.length > 0) {
      setData(initialData);
    } else if (data.length === 0 && initializeWithEmptyRows) { // Only create empty rows if explicitly requested
      const emptyRows = Array.from({ length: 10 }, (_, index) => {
        const row: ExcelData = {};
        columns.forEach((col) => {
          row[col] = '';
        });
        return row;
      });
      setData(emptyRows);
    }
  }, [data.length, initialData, columns, initializeWithEmptyRows]);

  // Filter data based on filter values and date range
  const filteredData = useMemo(() => {
    let result = data.filter(row => {
      return Object.keys(filters).every(column => {
        if (!filters[column]) return true;
        const cellValue = String(row[column] || '').toLowerCase();
        return cellValue.includes(filters[column].toLowerCase());
      });
    });

    // Apply date range filter if enabled and date column exists
    if (enableDateRangeFilter && (dateRange.from || dateRange.to) && columns.includes('Date')) {
      console.log('Applying date range filter:', dateRange);
      console.log('Data before filtering:', result.length, 'rows');

      result = result.filter(row => {
        const dateValue = row["Date"];
        if (!dateValue) {
          console.log('Skipping row without date:', row);
          return true; // Include rows without dates
        }

        try {
          // Parse the date string (now handling YYYY-MM-DD format from API)
          let rowDate: Date;

          const dateString = String(dateValue);
          // Check if date is in YYYY-MM-DD format (from API)
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            // Parse YYYY-MM-DD format
            const [year, month, day] = dateString.split('-').map(Number);
            rowDate = new Date(year, month - 1, day); // JS months are 0-indexed
          } else {
            // Handle other formats (like DD-MM-YYYY)
            const dateParts = dateString.split('-');
            if (dateParts.length !== 3) {
              console.log('Skipping row with invalid date format:', dateValue);
              return true; // Include rows with invalid date format
            }

            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
            const year = parseInt(dateParts[2], 10);

            rowDate = new Date(year, month, day);
          }

          console.log('Parsed date:', rowDate, 'from:', dateValue);

          // Check if rowDate is within the selected range
          let inRange = true;
          if (dateRange.from) {
            inRange = inRange && rowDate >= dateRange.from;
          }
          if (dateRange.to) {
            // Set time to end of day for 'to' date
            const toDate = new Date(dateRange.to);
            toDate.setHours(23, 59, 59, 999);
            inRange = inRange && rowDate <= toDate;
          }

          console.log('Date in range:', inRange, 'Row date:', rowDate, 'From:', dateRange.from, 'To:', dateRange.to);
          return inRange;
        } catch (e) {
          // If date parsing fails, include the row
          console.log('Error parsing date, including row:', dateValue, e);
          return true;
        }
      });

      console.log('Data after filtering:', result.length, 'rows');
    }

    return result;
  }, [data, filters, dateRange, enableDateRangeFilter, columns]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, rowsPerPage]);

  // Total pages
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle admin login
  const handleAdminLogin = () => {
    // Redirect to login if not authenticated
    const loginUrl = '/api/auth/login';
    fetch(loginUrl)
      .then(res => res.json())
      .then(data => {
        if (data.redirect_url) window.location.href = data.redirect_url;
      });
  };

  // Handle admin logout
  const handleAdminLogout = () => {
    // Use global logout
    localStorage.clear();
    window.location.reload();
  };

  // Export to Excel
  const exportToExcel = (): void => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();

    // Set column widths based on content with improved calculation
    const columnWidths = columns.map((col) => {
      const maxLength = Math.max(
        col.length,
        ...filteredData.map(row => String(row[col] || '').length)
      );
      // More accurate width calculation with better padding
      // Using 1.2 multiplier for better Excel column width estimation
      return { wch: Math.min(Math.max(Math.ceil(maxLength * 1.2), 15), 50) };
    });
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Import from Excel
  const importFromExcel = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelData[];

        setData(jsonData);
      } catch (error) {
        console.error('Error reading Excel file:', error);
      }
    };
    reader.readAsBinaryString(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add new row (admin only)
  const addRow = (): void => {
    if (!isAdmin) {
      setShowAdminLogin(true);
      return;
    }

    const newRow: ExcelData = {};
    columns.forEach((col) => {
      newRow[col] = '';
    });
    setData([...data, newRow]);
  };

  // Start editing cell (admin only for certain columns)
  const startEditing = (rowIndex: number, column: string): void => {
    // Adjust rowIndex for pagination
    const actualRowIndex = (currentPage - 1) * rowsPerPage + rowIndex;

    // Allow editing for all users on non-sensitive columns
    // Restrict editing for sensitive columns to admin only
    const sensitiveColumns = ['Link to Intimation', 'PDF Link']; // Add more columns as needed

    if (sensitiveColumns.includes(column) && !isAdmin) {
      setShowAdminLogin(true);
      return;
    }

    setEditingCell({ row: actualRowIndex, col: column });
    setEditValue(String(data[actualRowIndex][column] || ''));
  };

  // Save cell edit
  const saveCellEdit = (): void => {
    if (!editingCell) return;

    const newData = [...data];
    newData[editingCell.row][editingCell.col] = editValue;
    setData(newData);
    setEditingCell(null);
    setEditValue('');
  };

  // Cancel cell edit
  const cancelEdit = (): void => {
    setEditingCell(null);
    setEditValue('');
  };

  // Handle key press in editing mode
  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      saveCellEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Handle link opening
  const handleOpenLink = (url: string): void => {
    if (url && url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Check if content is a URL
  const isURL = (text: string): boolean => {
    return text && (text.startsWith('http://') || text.startsWith('https://'));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={onClose ? "fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4" : ""}
      onClick={onClose ? (e) => e.target === e.currentTarget && onClose?.() : undefined}
    >
      <Card className={onClose ? "w-full max-w-none max-h-[90vh] overflow-hidden" : "w-full overflow-hidden"} style={{
        background: "#ffffff",
        boxShadow: "none",
        border: "1px solid rgba(97, 150, 254, 0.3)"
      }}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-6 w-6" style={{ color: '#6196FE' }} />
              <CardTitle className="text-xl font-semibold " style={{ color: '#301B89' }}>
                {title}
              </CardTitle>
            </div>

            <div className="flex items-center gap-2">
              {/* Date Range Picker - only show if enabled */}
              {enableDateRangeFilter && (
                <div className="flex items-center gap-2">
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        style={{
                          borderColor: '#46798E',
                          color: '#46798E',
                          backgroundColor: 'transparent'
                        }}
                      >
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {getDateRangeText()}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={handleDateRangeSelect}
                        numberOfMonths={1}
                        className="rounded-md border"
                        style={{ backgroundColor: 'white' }}
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Clear date filter button */}
                  {(dateRange.from || dateRange.to) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearDateRange}
                      className="h-8 w-8 p-0"
                      style={{ color: '#46798E' }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}

              {/* Admin Status Indicator */}
              {isAdmin && (
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: 'rgba(30, 64, 175, 0.1)',
                    color: '#1E40AF',
                    border: '1px solid rgba(30, 64, 175, 0.3)'
                  }}
                >
                  ADMIN MODE
                </Badge>
              )}

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

              {/* Admin Login/Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={isAdmin ? handleAdminLogout : () => setShowAdminLogin(true)}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: isAdmin ? 'rgba(220, 38, 38, 0.1)' : 'rgba(30, 64, 175, 0.1)',
                  borderColor: isAdmin ? 'rgba(220, 38, 38, 0.3)' : 'rgba(30, 64, 175, 0.3)',
                  color: isAdmin ? '#dc2626' : '#1E40AF'
                }}
              >
                {isAdmin ? 'Logout' : 'Admin'}
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

          {/* Admin Login Modal - No longer needed with SSO, keeping as placeholder or redirect */}
          {showAdminLogin && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold" style={{ color: '#301B89' }}>
                    Authentication Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">You need administrative privileges to perform this action. Please sign in via Azure AD.</p>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAdminLogin(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAdminLogin}
                      style={{
                        backgroundColor: '#1E40AF',
                        color: 'white'
                      }}
                    >
                      Sign In
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={importFromExcel}
            style={{ display: 'none' }}
          />
        </CardHeader>

        <CardContent className="p-0">
          <div className={`overflow-auto ${onClose ? 'max-h-[calc(90vh-140px)]' : 'max-h-[500px]'}`} style={{ height: containerHeight }}>
            <div className="grid gap-0 border" style={{
              gridTemplateColumns: columns.map(col => columnWidths[col] || 'minmax(120px, 1fr)').concat('80px').join(' '),
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
              <div className="bg-gray-100 p-2 text-xs text-center" style={{
                borderColor: 'rgba(97, 150, 254, 0.2)',
                width: '80px'
              }}>
                View
              </div>

              {/* Filter Row */}
              {columns.map((column, index) => (
                <div
                  key={`filter-${column}`}
                  className="bg-gray-50 p-1 border-r border-b text-xs"
                  style={{
                    borderColor: 'rgba(97, 150, 254, 0.2)'
                  }}
                >
                  <Input
                    type="text"
                    placeholder={`Filter ${column}`}
                    value={filters[column] || ''}
                    onChange={(e) => handleFilterChange(column, e.target.value)}
                    className="h-6 text-xs border-none p-1 w-full"
                    style={{ backgroundColor: 'rgba(97, 150, 254, 0.05)' }}
                  />
                </div>
              ))}
              <div className="bg-gray-50 p-1 border-b text-center" style={{
                borderColor: 'rgba(97, 150, 254, 0.2)',
                width: '80px'
              }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 text-xs"
                  style={{
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderColor: 'rgba(255, 0, 0, 0.3)',
                    color: '#ff0000'
                  }}
                >
                  Clear
                </Button>
              </div>

              {/* Data Rows */}
              {paginatedData.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {/* Data Cells */}
                  {columns.map((column, colIndex) => (
                    <div
                      key={`${rowIndex}-${column}`}
                      className="p-1 border-r border-b relative group hover:bg-blue-50 cursor-pointer"
                      style={{
                        borderColor: 'rgba(97, 150, 254, 0.2)'
                      }}
                      onClick={() => startEditing(rowIndex, column)}
                    >
                      {editingCell?.row === (currentPage - 1) * rowsPerPage + rowIndex && editingCell?.col === column ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyPress}
                          onBlur={saveCellEdit}
                          className="h-8 text-xs border-none p-1 w-full"
                          autoFocus
                        />
                      ) : (
                        <div className="text-xs p-1 min-h-[24px] flex items-center max-h-20 overflow-y-auto" title={String(row[column] || '')}>
                          {(column === 'Link to Intimation' || column === 'PDF Link') && isURL(String(row[column] || '')) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenLink(String(row[column] || ''))}
                              className="flex items-center gap-1 h-6 px-2"
                              style={{
                                backgroundColor: 'rgba(97, 150, 254, 0.1)',
                                borderColor: 'rgba(97, 150, 254, 0.3)',
                                color: '#6196FE'
                              }}
                            >
                              <ExternalLink size={10} />
                              <span className="text-xs">Visit</span>
                            </Button>
                          ) : (
                            <span className="truncate">
                              {String(row[column] || '')}
                            </span>
                          )}
                          <Edit3
                            size={12}
                            className="ml-auto opacity-0 group-hover:opacity-50 transition-opacity"
                            style={{ color: '#6196FE' }}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Actions Cell */}
                  <div className="p-2 border-b text-center" style={{
                    borderColor: 'rgba(97, 150, 254, 0.2)',
                    width: '80px'
                  }}>
                    {onViewRow && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewRow(row, (currentPage - 1) * rowsPerPage + rowIndex)}
                        className="h-6 w-6 p-0 hover:bg-blue-100"
                        style={{
                          color: '#6196FE',
                          borderColor: 'rgba(97, 150, 254, 0.3)'
                        }}
                      >
                        <Eye size={12} />
                      </Button>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t" style={{ borderColor: 'rgba(97, 150, 254, 0.2)' }}>
              <div className="text-sm" style={{ color: '#301B89' }}>
                Showing {Math.min((currentPage - 1) * rowsPerPage + 1, filteredData.length)} - {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} records
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="h-8"
                  style={{
                    backgroundColor: 'rgba(97, 150, 254, 0.1)',
                    borderColor: 'rgba(97, 150, 254, 0.3)',
                    color: '#6196FE'
                  }}
                >
                  Previous
                </Button>
                <span className="text-sm" style={{ color: '#301B89' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8"
                  style={{
                    backgroundColor: 'rgba(97, 150, 254, 0.1)',
                    borderColor: 'rgba(97, 150, 254, 0.3)',
                    color: '#6196FE'
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExcelView;