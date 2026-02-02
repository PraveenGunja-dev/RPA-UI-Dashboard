// Mock data for the dashboard - simulating Excel file content

export const monthlyData = [
  { month: "Jan", entity_name: "System A", total_notifications: 245, year: "2025" },
  { month: "Feb", entity_name: "System A", total_notifications: 312, year: "2025" },
  { month: "Mar", entity_name: "System A", total_notifications: 189, year: "2025" },
  { month: "Apr", entity_name: "System A", total_notifications: 278, year: "2025" },
  { month: "May", entity_name: "System A", total_notifications: 432, year: "2025" },
  { month: "Jun", entity_name: "System A", total_notifications: 378, year: "2025" },
  { month: "Jul", entity_name: "System A", total_notifications: 295, year: "2025" },
  { month: "Aug", entity_name: "System A", total_notifications: 356, year: "2025" },
  { month: "Sep", entity_name: "System A", total_notifications: 289, year: "2025" },
  { month: "Oct", entity_name: "System A", total_notifications: 398, year: "2025" },
  { month: "Nov", entity_name: "System A", total_notifications: 445, year: "2025" },
  { month: "Dec", entity_name: "System A", total_notifications: 367, year: "2025" },
];


export const weeklyData = [
  { week: "Aug W1", entity_name: "Network Hub", total_notifications: 156 },
  { week: "Aug W2", entity_name: "Network Hub", total_notifications: 189 },
  { week: "Aug W3", entity_name: "Network Hub", total_notifications: 142 },
  { week: "Aug W4", entity_name: "Network Hub", total_notifications: 198 },
  { week: "Aug W5", entity_name: "Network Hub", total_notifications: 134 }, // Partial week
];

// Generate daily data for August 2024
const generateAugust2024DailyData = () => {
  const data = [];
  const august2024 = new Date(2024, 7, 1); // Month is 0-indexed, so 7 = August
  
  // Generate data for all 31 days of August 2024
  for (let day = 1; day <= 31; day++) {
    const date = new Date(2024, 7, day);
    
    data.push({
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      total_entities: Math.floor(Math.random() * 40) + 10 // Random between 10-50
    });
  }
  
  return data;
};

export const dailyData = generateAugust2024DailyData();

// Utility function to filter daily data by date range
export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export const filterDailyDataByDateRange = (data: typeof dailyData, dateRange: DateRange) => {
  if (!dateRange.from || !dateRange.to) {
    return data;
  }
  
  // Convert dates to comparable format (YYYY-MM-DD)
  const fromDateStr = dateRange.from.toISOString().split('T')[0];
  const toDateStr = dateRange.to.toISOString().split('T')[0];
  
  return data.filter(item => {
    // Handle different date formats that might come from Excel
    let itemDateStr = item.date;
    
    // If item.date is already in YYYY-MM-DD format, use it directly
    // If it's in another format, try to parse it
    if (typeof item.date === 'string') {
      // Check if it's already in YYYY-MM-DD format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
        // Try to parse other formats
        const parsedDate = new Date(item.date);
        if (!isNaN(parsedDate.getTime())) {
          itemDateStr = parsedDate.toISOString().split('T')[0];
        }
      }
    } else if (item.date instanceof Date) {
      itemDateStr = item.date.toISOString().split('T')[0];
    }
    
    return itemDateStr >= fromDateStr && itemDateStr <= toDateStr;
  });
};

// Function to simulate real-time data updates with ECG-like variations
export const generateRandomData = () => {
  const getVariation = (baseValue: number, intensity: number = 0.3) => {
    const variation = (Math.random() - 0.5) * 2 * intensity;
    return Math.max(5, Math.floor(baseValue * (1 + variation)));
  };
  
  return {
    monthly: monthlyData.map(item => ({
      ...item,
      total_notifications: getVariation(item.total_notifications, 0.4)
    })),
    weekly: weeklyData.map(item => ({
      ...item,
      total_notifications: getVariation(item.total_notifications, 0.5)
    })),
    daily: dailyData.map(item => ({
      ...item,
      total_entities: getVariation(item.total_entities, 0.6)
    }))
  };
};

// High-frequency real-time data generator for live streams
export const generateLiveDataPoint = (type: 'ecg' | 'sine' | 'random' | 'pulse', time: number, amplitude: number = 100) => {
  switch (type) {
    case 'ecg':
      // ECG-like heartbeat pattern
      const heartRate = 75; // BPM
      const beatInterval = 60 / heartRate;
      const timeInBeat = (time % beatInterval) / beatInterval;
      
      let value = 0;
      if (timeInBeat >= 0.0 && timeInBeat <= 0.1) {
        value = Math.sin((timeInBeat - 0.0) * Math.PI / 0.1) * 0.2;
      } else if (timeInBeat > 0.2 && timeInBeat <= 0.3) {
        const qrsTime = (timeInBeat - 0.2) / 0.1;
        if (qrsTime <= 0.3) {
          value = -Math.sin(qrsTime * Math.PI / 0.3) * 0.3;
        } else if (qrsTime <= 0.7) {
          value = Math.sin((qrsTime - 0.3) * Math.PI / 0.4) * 1.0;
        } else {
          value = -Math.sin((qrsTime - 0.7) * Math.PI / 0.3) * 0.4;
        }
      } else if (timeInBeat > 0.5 && timeInBeat <= 0.8) {
        value = Math.sin((timeInBeat - 0.5) * Math.PI / 0.3) * 0.3;
      }
      return value * amplitude + (Math.random() - 0.5) * 5;
      
    case 'sine':
      return Math.sin(time * 2 * Math.PI) * amplitude + (Math.random() - 0.5) * 10;
      
    case 'random':
      const smoothness = 0.7;
      return (Math.random() - 0.5) * amplitude * smoothness + Math.sin(time) * amplitude * 0.3;
      
    case 'pulse':
      const pulseWidth = 0.1;
      const period = 2;
      const timeInPeriod = time % period;
      return timeInPeriod < (period * pulseWidth) ? amplitude : -amplitude * 0.1;
      
    default:
      return 0;
  }
};

// Simulate network latency and data bursts
export const generateBurstData = (count: number = 5) => {
  return Array.from({ length: count }, (_, i) => ({
    time: Date.now() + i * 100,
    value: Math.random() * 100 - 50,
    intensity: Math.random()
  }));
};