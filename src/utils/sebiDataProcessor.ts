// Utility functions for processing SEBI data for charts

export interface SEBIDataItem {
  id: number;
  date_key: string;
  row_index: number;
  pdf_link: string;
  summary: string;
  inserted_at: string;
}

export interface MonthlyDataPoint {
  month: string;
  year: string;
  total_notifications: number;
  entity_name: string;
}

export interface WeeklyDataPoint {
  week: string;
  total_notifications: number;
  entity_name: string;
}

export interface DailyDataPoint {
  date: string;
  total_entities: number;
}

// Function to process SEBI data into monthly chart data
export const processSEBIMonthlyData = (data: SEBIDataItem[]): MonthlyDataPoint[] => {
  // Filter out records with NIL pdf_link
  const filteredData = data.filter(item => item.pdf_link && item.pdf_link !== 'NIL');
  
  // Sort data by date_key in descending order (most recent first)
  const sortedData = [...filteredData].sort((a, b) => {
    const dateA = new Date(a.date_key);
    const dateB = new Date(b.date_key);
    
    // Handle invalid dates
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    
    return dateB.getTime() - dateA.getTime();
  });
  
  // Group data by month/year
  const monthlyMap: { [key: string]: number } = {};
  
  sortedData.forEach(item => {
    // Parse date_key to extract month and year
    const date = new Date(item.date_key);
    if (isNaN(date.getTime())) return; // Skip invalid dates
    
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear().toString();
    const key = `${month}-${year}`;
    
    if (!monthlyMap[key]) {
      monthlyMap[key] = 0;
    }
    monthlyMap[key] += 1;
  });
  
  // Convert to array format
  return Object.keys(monthlyMap).map(key => {
    const [month, year] = key.split('-');
    return {
      month,
      year,
      total_notifications: monthlyMap[key],
      entity_name: "SEBI Analysis"
    };
  });
};

// Function to process SEBI data into weekly chart data
export const processSEBIWeeklyData = (data: SEBIDataItem[]): WeeklyDataPoint[] => {
  // Filter out records with NIL pdf_link
  const filteredData = data.filter(item => item.pdf_link && item.pdf_link !== 'NIL');
  
  // Sort data by date_key in descending order (most recent first)
  const sortedData = [...filteredData].sort((a, b) => {
    const dateA = new Date(a.date_key);
    const dateB = new Date(b.date_key);
    
    // Handle invalid dates
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    
    return dateB.getTime() - dateA.getTime();
  });
  
  // Group data by week
  const weeklyMap: { [key: string]: number } = {};
  
  sortedData.forEach(item => {
    // Parse date_key to extract week
    const date = new Date(item.date_key);
    if (isNaN(date.getTime())) return; // Skip invalid dates
    
    // Get week number
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    
    const key = `${date.getFullYear()}-W${weekNumber}`;
    
    if (!weeklyMap[key]) {
      weeklyMap[key] = 0;
    }
    weeklyMap[key] += 1;
  });
  
  // Convert to array format
  return Object.keys(weeklyMap).map(key => {
    return {
      week: key,
      total_notifications: weeklyMap[key],
      entity_name: "SEBI Analysis"
    };
  });
};

// Function to process SEBI data into daily chart data
export const processSEBIDailyData = (data: SEBIDataItem[]): DailyDataPoint[] => {
  // Filter out records with NIL pdf_link
  const filteredData = data.filter(item => item.pdf_link && item.pdf_link !== 'NIL');
  
  // Debug: Log filtered data
  // console.log('Filtered SEBI Data:', filteredData);
  
  // Sort data by date_key in descending order (most recent first)
  const sortedData = [...filteredData].sort((a, b) => {
    const dateA = new Date(a.date_key);
    const dateB = new Date(b.date_key);
    
    // Handle invalid dates
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    
    return dateB.getTime() - dateA.getTime();
  });
  
  // If no data, return empty array
  if (sortedData.length === 0) {
    return [];
  }
  
  // Group data by date
  const dailyMap: { [key: string]: number } = {};
  
  sortedData.forEach(item => {
    // Use date_key directly but ensure it's in a valid format
    const date = item.date_key;
    
    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      // Skip invalid dates
      return;
    }
    
    if (!dailyMap[date]) {
      dailyMap[date] = 0;
    }
    dailyMap[date] += 1;
  });
  
  // Debug: Log daily map
  // console.log('Daily Map:', dailyMap);
  
  // Get the date range from the available data
  const dates = Object.keys(dailyMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const startDate = new Date(dates[0]);
  const endDate = new Date(dates[dates.length - 1]);
  
  // Debug: Log date range
  // console.log('Date Range:', { startDate, endDate });
  
  // Generate all dates in the range
  const allDates: string[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Format date to match the format used in dailyMap (YYYY-MM-DD)
    const formattedDate = currentDate.toISOString().split('T')[0];
    allDates.push(formattedDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Debug: Log all dates
  // console.log('All Dates:', allDates);
  
  // Create data points for all dates, using 0 for dates without data
  const dailyData: DailyDataPoint[] = allDates.map(date => ({
    date,
    total_entities: dailyMap[date] || 0
  }));
  
  // Debug: Log daily data
  // console.log('Daily Data:', dailyData);
  
  // Sort by date descending (most recent first)
  return dailyData.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    // Handle invalid dates
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    
    return dateB.getTime() - dateA.getTime();
  });
};

// Function to check if dates span multiple years
export const getDateFormatInfo = (dates: string[]): { hasMultipleYears: boolean; years: number[] } => {
  const years = dates
    .map(dateStr => {
      try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date.getFullYear();
      } catch {
        return null;
      }
    })
    .filter((year): year is number => year !== null);
  
  const uniqueYears = [...new Set(years)];
  return {
    hasMultipleYears: uniqueYears.length > 1,
    years: uniqueYears
  };
};