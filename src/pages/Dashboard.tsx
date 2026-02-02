import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Activity, Bell, TrendingUp, FileText, Loader2, AlertCircle, Calendar as CalendarIcon, X } from "lucide-react";
import BSEAlertsDashboardLayout from "@/components/layout/BSEAlertsDashboardLayout";
import MonthlyTrendChart from "@/components/charts/MonthlyTrendChart";
import WeeklyTrendChart from "@/components/charts/WeeklyTrendChart";
import DailyTrendChart from "@/components/charts/DailyTrendChart";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

import {
  monthlyData,
  weeklyData,
  dailyData,
  generateRandomData
} from "@/data/mockData";
import NotificationBar from "@/components/ui/NotificationBar";
import { hasRole } from "@/utils/adminAuth";

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

// Fetch combined workbook data from API with timeout
const fetchCombinedWorkbookData = async (fileName: string): Promise<CombinedWorkbookData> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  // Use explicit path since frontend and backend might be served from different ports
  const API_BASE_URL = '';

  try {
    const response = await fetch(`${API_BASE_URL}/combined-workbook-data/${fileName}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to get error message from response body
      let errorMessage = `Failed to fetch combined workbook data: ${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch (e) {
        // If we can't parse the error text, use the default message
      }
      throw new Error(errorMessage);
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Received non-JSON response from server');
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server is taking too long to respond (15 seconds elapsed)');
    }
    throw error;
  }
};

// Fetch special sheets data from API with timeout
const fetchSpecialSheetsData = async (fileName: string): Promise<SpecialSheetsData> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  // Use explicit path since frontend and backend might be served from different ports
  const API_BASE_URL = '';

  try {
    const response = await fetch(`${API_BASE_URL}/special-sheets-data/${fileName}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to get error message from response body
      let errorMessage = `Failed to fetch special sheets data: ${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch (e) {
        // If we can't parse the error text, use the default message
      }
      throw new Error(errorMessage);
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Received non-JSON response from server');
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server is taking too long to respond (15 seconds elapsed)');
    }
    throw error;
  }
};

// Fetch BSE alerts data from the new database endpoint
const fetchBSEAlertsData = async (limit: number = 100, offset: number = 0): Promise<any> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  // Use explicit path since frontend and backend might be served from different ports
  const API_BASE_URL = '';

  try {
    const response = await fetch(`${API_BASE_URL}/bse-alerts?limit=${limit}&offset=${offset}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to get error message from response body
      let errorMessage = `Failed to fetch BSE alerts data: ${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch (e) {
        // If we can't parse the error text, use the default message
      }
      throw new Error(errorMessage);
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Received non-JSON response from server');
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server is taking too long to respond (15 seconds elapsed)');
    }
    throw error;
  }
};

// Process data for charts (updated to work with BSE alerts data)
const processDataForBSEData = (data: any[]) => {
  // Group data by date for daily trend
  const dailyMap: { [key: string]: number } = {};

  data.forEach(item => {
    const date = item.date_key;
    if (date) {
      if (!dailyMap[date]) {
        dailyMap[date] = 0;
      }
      dailyMap[date] += 1;
    }
  });

  // Convert to array format for daily data and sort by date
  let dailyChartData = Object.keys(dailyMap).map(date => ({
    date,
    total_notifications: dailyMap[date]
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Get the latest date to determine the latest month
  let latestDateObj: Date | null = null;
  if (dailyChartData.length > 0) {
    latestDateObj = new Date(dailyChartData[dailyChartData.length - 1].date);
  }

  // Filter daily data to only show the latest month
  let filteredDailyChartData = dailyChartData;
  if (latestDateObj) {
    const latestMonth = latestDateObj.getMonth();
    const latestYear = latestDateObj.getFullYear();

    filteredDailyChartData = dailyChartData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === latestMonth && itemDate.getFullYear() === latestYear;
    });
  }

  // Group data by month/year for monthly chart (all months across all years)
  const monthlyMap: { [key: string]: number } = {};

  // Track all unique month-year combinations
  const monthYearSet = new Set<string>();

  data.forEach(item => {
    const date = item.date_key;
    if (date) {
      try {
        // Parse YYYY-MM-DD format
        const parts = date.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
          const day = parseInt(parts[2], 10);

          const dateObj = new Date(year, month, day);
          if (!isNaN(dateObj.getTime())) {
            // Create month-year key (e.g., "Sep-2025")
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = monthNames[month] || 'Unknown';
            const key = `${monthName}-${year}`;

            // Add to set of unique month-year combinations
            monthYearSet.add(key);

            if (!monthlyMap[key]) {
              monthlyMap[key] = 0;
            }
            monthlyMap[key] += 1;
          }
        }
      } catch (e) {
        console.error("Error parsing date for monthly data:", date, e);
      }
    }
  });

  // Convert monthYearSet to sorted array
  const sortedMonthYears = Array.from(monthYearSet).sort((a, b) => {
    const [monthA, yearA] = a.split('-');
    const [monthB, yearB] = b.split('-');

    // Sort by year first, then by month
    if (yearA !== yearB) {
      return parseInt(yearA) - parseInt(yearB);
    }

    // Month names in order
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.indexOf(monthA) - monthNames.indexOf(monthB);
  });

  // Ensure we show all months for the years that have data
  // Find the min and max years in our data
  let minYear = Infinity;
  let maxYear = -Infinity;

  if (sortedMonthYears.length > 0) {
    sortedMonthYears.forEach(key => {
      const [, year] = key.split('-');
      const yearNum = parseInt(year);
      if (yearNum < minYear) minYear = yearNum;
      if (yearNum > maxYear) maxYear = yearNum;
    });

    // Create a complete set of month-year combinations for all years in range
    const completeMonthYearSet = new Set<string>();
    for (let year = minYear; year <= maxYear; year++) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      monthNames.forEach(month => {
        completeMonthYearSet.add(`${month}-${year}`);
      });
    }

    // Add any missing months to the monthlyMap with 0 count
    completeMonthYearSet.forEach(key => {
      if (!monthlyMap[key]) {
        monthlyMap[key] = 0;
      }
    });

    // Re-sort with the complete set
    const completeSortedMonthYears = Array.from(completeMonthYearSet).sort((a, b) => {
      const [monthA, yearA] = a.split('-');
      const [monthB, yearB] = b.split('-');

      // Sort by year first, then by month
      if (yearA !== yearB) {
        return parseInt(yearA) - parseInt(yearB);
      }

      // Month names in order
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames.indexOf(monthA) - monthNames.indexOf(monthB);
    });

    // Convert to array format for monthly chart data (matching MonthlyTrendChart expectations)
    const monthlyChartData = completeSortedMonthYears.map(key => {
      const [month, year] = key.split('-');
      return {
        month,
        year,
        total_notifications: monthlyMap[key] || 0,  // Use actual count or 0 if no data
        entity_name: "BSE"  // Add entity_name for MonthlyTrendChart
      };
    });

    // If no data, create default months for current year
    if (monthlyChartData.length === 0) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const displayYear = new Date().getFullYear().toString();

      return monthNames.map(month => ({
        month,
        year: displayYear,
        total_notifications: 0,
        entity_name: "BSE"
      }));
    }

    // Group daily data into weeks for weekly chart (only for the latest month)
    const weeklyMap: { [key: string]: number } = {};

    if (latestDateObj) {
      const latestMonth = latestDateObj.getMonth();
      const latestYear = latestDateObj.getFullYear();

      dailyChartData.forEach(item => {
        // Parse the date to determine which week it belongs to
        try {
          const dateObj = new Date(item.date);
          // Only process data for the latest month and year
          if (dateObj.getMonth() === latestMonth && dateObj.getFullYear() === latestYear) {
            // Calculate week number within the month (1-5)
            // Week 1: 1-7, Week 2: 8-14, Week 3: 15-21, Week 4: 22-28, Week 5: 29-31
            const dayOfMonth = dateObj.getDate();
            const weekNumber = Math.ceil(dayOfMonth / 7);

            // Use format like "Week 1", "Week 2", etc.
            const weekKey = `Week ${weekNumber}`;

            if (!weeklyMap[weekKey]) {
              weeklyMap[weekKey] = 0;
            }
            weeklyMap[weekKey] += item.total_notifications;
          }
        } catch (e) {
          console.error("Error parsing date:", item.date, e);
        }
      });
    }

    // Convert to array format for weekly data (time-based)
    const weeklyTimeData = Object.keys(weeklyMap).map(week => ({
      week,
      total_notifications: weeklyMap[week]
    })).sort((a, b) => {
      // Simple sorting by string comparison for month/week format
      return a.week.localeCompare(b.week);
    });

    // Create entity distribution data for the weekly chart (entity-based)
    const entityMap: { [key: string]: number } = {};
    data.forEach(item => {
      const entityName = item.EntityName || "Unknown Entity";
      if (!entityMap[entityName]) {
        entityMap[entityName] = 0;
      }
      entityMap[entityName] += 1;
    });

    // Convert to array format for entity distribution data
    const weeklyEntityData = Object.keys(entityMap).map(entity => ({
      week: entity, // Using "week" property to match the chart component interface
      total_notifications: entityMap[entity]
    })).sort((a, b) => b.total_notifications - a.total_notifications); // Sort by count descending

    return {
      daily: filteredDailyChartData,   // Only latest month
      monthly: monthlyChartData,       // All months
      weekly: weeklyTimeData,         // Time-based weekly data
      entity: weeklyEntityData        // Entity-based distribution data
    };
  } else {
    // If no data, create default months for current year
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const displayYear = new Date().getFullYear().toString();

    const monthlyChartData = monthNames.map(month => ({
      month,
      year: displayYear,
      total_notifications: 0,
      entity_name: "BSE"
    }));

    return {
      daily: filteredDailyChartData,   // Only latest month
      monthly: monthlyChartData,       // All months with default zero
      weekly: [],                      // Empty weekly data
      entity: []                       // Empty entity data
    };
  }
};

// Transform BSE alerts data to match ExcelView format
const transformBSEDataForExcelView = (data: any[]) => {
  return data.map(item => ({
    "SrNo": item.id,
    "Name of Entity": item.entity_name || "Unknown Entity", // Using the actual EntityName from database
    "Link to Intimation": item.pdf_link, // Using the expected column name
    "Nature of Intimation": item.nature || "N/A", // Using the actual Nature from database
    "Summary of Intimation": item.summary, // Using the expected column name
    "Date": item.date_key
  }));
};

// Get month and year from the first row's date value
const getMonthYearFromFirstRow = (data: any[]) => {
  if (!data || data.length === 0) {
    // Fallback to current month/year if no data
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const now = new Date();
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  }

  // Get the first row's date
  const firstRow = data[0];
  let dateStr = firstRow["Date"];

  // Try other possible date column names if "Date" doesn't exist
  if (!dateStr) {
    const possibleDateColumns = ["Date", "date", "date_key", "Date Key", "Run Date", "Run_Date"];
    for (const col of possibleDateColumns) {
      if (firstRow[col]) {
        dateStr = firstRow[col];
        break;
      }
    }
  }

  if (!dateStr) {
    // Fallback to current month/year if no date
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const now = new Date();
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  }

  try {
    // Handle different date formats
    let dateObj: Date | null = null;

    // If it's already a Date object or timestamp
    if (dateStr instanceof Date) {
      dateObj = dateStr;
    }
    // If it's a timestamp number
    else if (typeof dateStr === 'number') {
      dateObj = new Date(dateStr);
    }
    // If it's a string
    else if (typeof dateStr === 'string') {
      // Try parsing as ISO date string (YYYY-MM-DD)
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateObj = new Date(dateStr);
      }
      // Try parsing as DD-MM-YYYY format
      else if (dateStr.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
          const year = parseInt(parts[2], 10);
          dateObj = new Date(year, month, day);
        }
      }
      // Try parsing as MM/DD/YYYY format
      else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[0], 10) - 1; // JS months are 0-indexed
          const day = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          dateObj = new Date(year, month, day);
        }
      }
      // Try parsing as YYYY/MM/DD format
      else if (dateStr.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
          const day = parseInt(parts[2], 10);
          dateObj = new Date(year, month, day);
        }
      }
      // If all else fails, try to parse with Date constructor
      else {
        dateObj = new Date(dateStr);
      }
    }

    // Check if we have a valid date
    if (dateObj && !isNaN(dateObj.getTime())) {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    }
  } catch (e) {
    console.error("Error parsing date:", dateStr, e);
  }

  // Fallback to current month/year if parsing fails
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const now = new Date();
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
};

const getLatestMonthYear = (data: any[]) => {
  if (!data || data.length === 0) {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const now = new Date();
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  }
  const parseDate = (s: any) => {
    if (!s) return null;
    if (s instanceof Date) return s;
    if (typeof s === 'number') return new Date(s);
    const v = String(s);
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v);
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(v)) {
      const [d, m, y] = v.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)) {
      const [m, d, y] = v.split('/').map(Number);
      return new Date(y, m - 1, d);
    }
    const dt = new Date(v);
    return isNaN(dt.getTime()) ? null : dt;
  };
  let max: Date | null = null;
  for (const row of data) {
    const d = parseDate(row["Date"] || row["date"] || row["date_key"] || row["Date Key"] || row["Run Date"] || row["Run_Date"]);
    if (d && (!max || d > max)) max = d;
  }
  if (max) {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${monthNames[max.getMonth()]} ${max.getFullYear()}`;
  }
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const now = new Date();
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
};

// Filter data to show only the latest month
const filterDataByLatestMonth = (data: any[]) => {
  if (!data || data.length === 0) return data;

  // Find the latest date in the data
  let latestDate: Date | null = null;
  data.forEach(item => {
    const dateValue = item["Date"];
    if (dateValue) {
      try {
        let itemDate: Date;
        const dateString = String(dateValue);

        // Check if date is in YYYY-MM-DD format (from API)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          const [year, month, day] = dateString.split('-').map(Number);
          itemDate = new Date(year, month - 1, day); // JS months are 0-indexed
        } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateString)) {
          // Handle DD-MM-YYYY format
          const [day, month, year] = dateString.split('-').map(Number);
          itemDate = new Date(year, month - 1, day);
        } else {
          // Try to parse with Date constructor
          itemDate = new Date(dateString);
        }

        // Check if itemDate is valid
        if (!isNaN(itemDate.getTime())) {
          if (!latestDate || itemDate > latestDate) {
            latestDate = itemDate;
          }
        }
      } catch (e) {
        console.error("Error parsing date:", dateValue, e);
      }
    }
  });

  // If no valid dates found, return original data
  if (!latestDate) return data;

  // Filter data to only include records from the latest month
  const latestMonth = latestDate.getMonth();
  const latestYear = latestDate.getFullYear();

  return data.filter(item => {
    const dateValue = item["Date"];
    if (!dateValue) return false;

    try {
      let itemDate: Date;
      const dateString = String(dateValue);

      // Check if date is in YYYY-MM-DD format (from API)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        itemDate = new Date(year, month - 1, day); // JS months are 0-indexed
      } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateString)) {
        // Handle DD-MM-YYYY format
        const [day, month, year] = dateString.split('-').map(Number);
        itemDate = new Date(year, month - 1, day);
      } else {
        // Try to parse with Date constructor
        itemDate = new Date(dateString);
      }

      // Check if itemDate is valid
      if (isNaN(itemDate.getTime())) return false;

      return itemDate.getMonth() === latestMonth && itemDate.getFullYear() === latestYear;
    } catch (e) {
      console.error("Error parsing date:", dateValue, e);
      return false;
    }
  });
};

const Dashboard = () => {
  // Add scroll to top effect
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [workbookData, setWorkbookData] = useState<CombinedWorkbookData | null>(null);
  const [filteredWorkbookData, setFilteredWorkbookData] = useState<CombinedWorkbookData | null>(null);
  const [specialSheetsData, setSpecialSheetsData] = useState<SpecialSheetsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [useCache, setUseCache] = useState<boolean>(true);
  const [bseAlertsData, setBseAlertsData] = useState<any[] | null>(null); // New state for BSE alerts data
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

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

  // Handle date range selection
  const handleDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined): void => {
    if (range) {
      setDateRange(range);
      if (range.from && range.to) {
        setIsCalendarOpen(false);
      }
    }
  };

  // Clear date range filter
  const clearDateRange = (): void => {
    setDateRange({ from: undefined, to: undefined });
  };

  // Filter data based on date range
  useEffect(() => {
    if (!workbookData) return;

    if (!dateRange.from && !dateRange.to) {
      // When no date range is selected, filter Excel view to show only the latest month
      // But keep the original total count
      const latestMonthData = filterDataByLatestMonth(workbookData.combined_data);
      const newWorkbookData = {
        ...workbookData,
        combined_data: latestMonthData
        // Keep the original count (total count from API response)
      };
      setFilteredWorkbookData(newWorkbookData);
      return;
    }

    const filtered = workbookData.combined_data.filter(row => {
      const dateValue = row["Date"];
      if (!dateValue) return true;

      try {
        // Parse the date string
        let rowDate: Date;
        const dateString = String(dateValue);

        // Check if date is in YYYY-MM-DD format (from API)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          const [year, month, day] = dateString.split('-').map(Number);
          rowDate = new Date(year, month - 1, day); // JS months are 0-indexed
        } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateString)) {
          // Handle DD-MM-YYYY format
          const [day, month, year] = dateString.split('-').map(Number);
          rowDate = new Date(year, month - 1, day);
        } else {
          // Try to parse with Date constructor
          rowDate = new Date(dateString);
        }

        // Check if rowDate is valid
        if (isNaN(rowDate.getTime())) return true;

        // Check if date is within range
        const fromValid = !dateRange.from || rowDate >= dateRange.from;
        const toValid = !dateRange.to || rowDate <= dateRange.to;

        return fromValid && toValid;
      } catch (e) {
        console.error("Error parsing date:", dateValue, e);
        return true;
      }
    });

    // Create new workbook data with filtered data
    const newWorkbookData = {
      ...workbookData,
      combined_data: filtered,
      count: filtered.length
    };

    setFilteredWorkbookData(newWorkbookData);
  }, [workbookData, dateRange]);

  // Handle refresh with optimizations
  const handleRefresh = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Fetch BSE alerts data from the new endpoint
      const bseDataResponse = await fetchBSEAlertsData(1000, 0); // Fetch all valid records (there are 835)
      const bseData = bseDataResponse.data;
      const totalNotificationsCount = bseDataResponse.count; // Get total count from API response

      // Process data for charts (using all data for charts)
      const processedChartData = processDataForBSEData(bseData);
      setChartData(processedChartData);

      // Transform data for ExcelView
      const transformedData = transformBSEDataForExcelView(bseData);

      // Apply filtering to remove invalid data
      const filteredData = filterData(transformedData);

      // Filter to show only latest month for Excel view
      const latestMonthData = filterDataByLatestMonth(filteredData);

      // Create mock workbook data structure for ExcelView
      const mockWorkbookData: CombinedWorkbookData = {
        file_name: "bse_alerts.db",
        sheets: ["DailyLogs"],
        combined_data: latestMonthData, // Only latest month for Excel view
        count: totalNotificationsCount, // Total count from API response
        special_sheets_excluded: []
      };

      setWorkbookData(mockWorkbookData);
    } catch (err) {
      console.error("Error refreshing workbook data:", err);
      setError(err instanceof Error ? err.message : "Failed to refresh workbook data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load workbook data on component mount
  useEffect(() => {
    const loadWorkbookData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch BSE alerts data from the new endpoint
        const bseDataResponse = await fetchBSEAlertsData(1000, 0); // Fetch all valid records (there are 835)
        const bseData = bseDataResponse.data;
        const totalNotificationsCount = bseDataResponse.count; // Get total count from API response

        // Process data for charts (using all data for charts)
        const processedChartData = processDataForBSEData(bseData);
        setChartData(processedChartData);

        // Transform data for ExcelView
        const transformedData = transformBSEDataForExcelView(bseData);

        // Apply filtering to remove invalid data
        const filteredData = filterData(transformedData);

        // Filter to show only latest month for Excel view
        const latestMonthData = filterDataByLatestMonth(filteredData);

        // Create mock workbook data structure for ExcelView
        const mockWorkbookData: CombinedWorkbookData = {
          file_name: "bse_alerts.db",
          sheets: ["DailyLogs"],
          combined_data: latestMonthData, // Only latest month for Excel view
          count: totalNotificationsCount, // Total count from API response
          special_sheets_excluded: []
        };

        setWorkbookData(mockWorkbookData);
      } catch (err) {
        console.error("Error loading workbook data:", err);
        setError(err instanceof Error ? err.message : "Failed to load workbook data");
      } finally {
        setLoading(false);
      }
    };

    loadWorkbookData();
  }, []);

  if (loading && !workbookData) {
    return (
      <BSEAlertsDashboardLayout>
        <NotificationBar />
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: "#46798E" }} />
            <p className="text-lg" style={{ color: "#000000" }}>Loading BSE Alerts data...</p>
          </div>
        </div>
      </BSEAlertsDashboardLayout>
    );
  }

  if (error && !workbookData) {
    return (
      <BSEAlertsDashboardLayout>
        <NotificationBar />
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
          <div className="text-center p-6 max-w-md">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: "#EF4444" }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: "#000000" }}>Error Loading BSE Alerts Data</h2>
            <p className="mb-4" style={{ color: "#000000" }}>{error}</p>
            <Button
              onClick={handleRefresh}
              style={{
                backgroundColor: '#46798E',
                borderColor: '#46798E',
                color: 'white'
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </BSEAlertsDashboardLayout>
    );
  }

  return (
    <BSEAlertsDashboardLayout>
      {/* Notification Bar at top of page */}
      <NotificationBar />

      <div className="min-h-screen" style={{
        background: "#ffffff"
      }}>
        {/* Main Content Container */}
        <div className="w-full px-4">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            className="mb-8"
          >
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="px-0 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="h-8 w-8" style={{ color: "#46798E" }} />
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ color: "#000000" }}>
                    BSE DASHBOARD
                  </CardTitle>
                </div>
                <CardDescription className="text-lg" style={{ color: '#000000' }}>
                  Real-time monitoring and analytics for Bombay Stock Exchange notifications
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          {/* 4-Tile Grid Layout: 1 Stats Tile + 3 Chart Tiles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 mb-12">
            {/* Total Notifications Tile - Top Left */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="lg:col-span-1 h-[250px]"
            >
              <Card className="h-full" style={{
                background: "#ffffff",
                border: 'none',
                boxShadow: 'none'
              }}>
                <CardHeader className="relative pb-1">
                  <div className="relative z-10 flex items-center gap-1">
                    <Bell className="h-5 w-5" style={{ color: "#46798E" }} />
                    <div>
                      <CardTitle className="text-base font-semibold font-mono leading-tight" style={{ color: '#010741' }}>
                        Total Notifications
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col justify-center items-center h-full pb-2">
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-center"
                  >
                    <div className="text-4xl font-bold font-mono mb-2" style={{ color: '#46798E' }}>
                      {specialSheetsData ? 785 : workbookData?.count || 0}
                    </div>
                    <div className="text-sm font-mono" style={{ color: 'rgba(1, 7, 65, 0.8)' }}>
                      Till Date
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <TrendingUp size={14} style={{ color: '#46798E' }} />
                      <span className="text-xs font-mono" style={{ color: '#7E659E' }}>LIVE MONITORING</span>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Daily Trend Chart - Top Right */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.6 }}
              className="lg:col-span-1 h-[250px]"
            >
              <DailyTrendChart data={chartData?.daily || []} />
            </motion.div>

            {/* Monthly Trend Chart - Bottom Left */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.9 }}
              className="lg:col-span-1 h-[250px]"
            >
              <MonthlyTrendChart data={chartData?.monthly || []} />
            </motion.div>

            {/* Weekly Trend Chart (now with pie chart) - Bottom Right */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 1.2 }}
              className="lg:col-span-1 h-[250px]"
            >
              <WeeklyTrendChart data={chartData?.weekly || []} />
            </motion.div>
          </div>

          {/* Excel View Section with proper spacing */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.8 }}
            className="mt-8"
          >
            {filteredWorkbookData ? (
              <ExcelView
                initialData={filteredWorkbookData.combined_data}
                columns={["Name of Entity", "Link to Intimation", "Nature of Intimation", "Summary of Intimation", "Date"]}
                title={`${getLatestMonthYear(filteredWorkbookData.combined_data)} Notifications`}
                onViewRow={(row, rowIndex) => {
                  handleViewNotification(row);
                }}
                canEdit={hasRole('bse_manager')}
                initializeWithEmptyRows={false}
                columnWidths={{
                  "Date": "120px",
                  "Link to Intimation": "150px",
                  "Name of Entity": "minmax(150px, 1fr)",
                  "Nature of Intimation": "minmax(150px, 1fr)",
                  "Summary of Intimation": "minmax(200px, 2fr)"
                }}
                enableDateRangeFilter={true}
                onDateRangeChange={handleDateRangeSelect}
                initialDateRange={dateRange}
              />
            ) : (
              <ExcelView
                initialData={[]}
                columns={["Name of Entity", "Link to Intimation", "Nature of Intimation", "Summary of Intimation", "Date"]}
                title={`${getMonthYearFromFirstRow([])} Notifications`}
                onViewRow={(row, rowIndex) => {
                  handleViewNotification(row);
                }}
                initializeWithEmptyRows={false}
                columnWidths={{
                  "Date": "120px",
                  "Link to Intimation": "150px",
                  "Name of Entity": "minmax(150px, 1fr)",
                  "Nature of Intimation": "minmax(150px, 1fr)",
                  "Summary of Intimation": "minmax(200px, 2fr)"
                }}
                enableDateRangeFilter={true}
                onDateRangeChange={handleDateRangeSelect}
                initialDateRange={dateRange}
              />
            )}
          </motion.div>

          {/* System Status Footer - REMOVED as per user request */}
        </div>
      </div>

      {/* Notification Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto w-full" style={{ background: '#ffffff' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-mono" style={{ color: '#010741' }}>
              <FileText className="h-6 w-6" style={{ color: '#E4A6CB' }} />
              Notification Details
            </DialogTitle>
            <DialogDescription style={{ color: '#46798E', fontWeight: '600' }}>
              Detailed information for the selected notification record
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6 mt-4 w-full">
              {/* Entity Information */}
              <div className="grid grid-cols-1 gap-4 w-full">
                <Card style={{ background: '#ffffff', border: '2px solid #46798E', boxShadow: '0 4px 15px rgba(70, 121, 142, 0.2)' }} className="w-full">
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

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t w-full" >
                <div className="text-xs font-mono font-semibold" style={{ color: '#46798E' }}>
                  Record viewed at {new Date().toLocaleString()}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setIsModalOpen(false)}
                    className="font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #010741, #46798E)',
                      borderColor: '#010741',
                      color: 'white',
                      boxShadow: '0 3px 12px rgba(1, 7, 65, 0.3)'
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

export default Dashboard;
