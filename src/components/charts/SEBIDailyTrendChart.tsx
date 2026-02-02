import { useState } from "react";
import { motion } from "framer-motion";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface DailyData {
  date: string;
  total_entities: number;
}

interface SEBIDailyTrendChartProps {
  data: DailyData[];
}

const chartConfig = {
  total_entities: {
    label: "Notifications",
    color: "#46798E", // Changed from #BD3861 to match BSE Alerts
  },
} satisfies ChartConfig;

// Simple function to extract day and month from date string
const extractDayMonth = (dateString: string): string => {
  // Handle YYYY-MM-DD format
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${parseInt(day, 10)} ${monthNames[monthIndex]}`;
    }
  }
  
  // If it's already in a simple format like "28-09-2025", extract just day and month
  if (dateString.includes('-')) {
    const parts = dateString.split('-');
    if (parts.length >= 3) {
      const day = parts[0];
      const month = parts[1];
      
      // Convert month number to short name
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = parseInt(month, 10) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${parseInt(day, 10)} ${monthNames[monthIndex]}`;
      }
    }
  }
  
  // If it's already in a good format, return as is
  if (dateString.match(/^\d{1,2} [A-Za-z]{3}$/)) {
    return dateString;
  }
  
  // Try to parse as a date and format it
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { 
        day: 'numeric',
        month: 'short'
      });
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  // Fallback: return the original string
  return dateString;
};

const SEBIDailyTrendChart = ({ data }: SEBIDailyTrendChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Debug: Log the incoming data
  // console.log('SEBI Daily Trend Chart Data:', data);

  // Format dates for display
  const processedData = data.map(item => ({
    ...item,
    displayDate: extractDayMonth(item.date)
  }));

  // Debug: Log the processed data
  // console.log('SEBI Daily Trend Processed Data:', processedData);

  // Type-safe calculations with proper null/undefined handling
  const totalEntities = data.reduce((sum, item) => sum + (item.total_entities || 0), 0);
  const averageEntities = data.length > 0 ? Math.round(totalEntities / data.length) : 0;
  const maxEntities = data.length > 0 ? Math.max(...data.map(item => item.total_entities || 0)) : 0;

  // If no data, show a message
  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
        }}
        transition={{ 
          duration: 1.0,
          delay: 0.2
        }}
        className="w-full"
      >
        <Card className="w-full" style={{
          backgroundColor: "white",
          border: 'none',
          boxShadow: "none"
        }}>
          <CardHeader className="relative">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold" style={{ color: '#010741' }}> 
                  Daily Trend Analysis
                </CardTitle>
                <CardDescription className="text-xs" style={{ color: 'rgba(1, 7, 65, 0.8)' }}> {/* Changed from rgba(189, 56, 97, 0.8) */}
                  Notification count by day (All days in range) - Valid PDF Links Only
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-1 relative">
            <div className="flex items-center justify-center h-32 sm:h-36 lg:h-40">
              <p className="text-muted-foreground text-sm">No data available for the selected period</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
      }}
      transition={{ 
        duration: 1.0,
        delay: 0.2
      }}
      className="w-full"
    >
      <Card className="w-full" style={{
        backgroundColor: "white",
        border: 'none',
        boxShadow: "none"
      }}>
        <CardHeader className="relative">
         
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold" style={{ color: '#010741' }}> 
                Daily Trend Analysis
              </CardTitle>
              <CardDescription className="text-xs" style={{ color: 'rgba(1, 7, 65, 0.8)' }}> {/* Changed from rgba(189, 56, 97, 0.8) */}
                Notification count by day (All days in range) - Valid PDF Links Only
              </CardDescription>
            </div>
            
          </div>
        </CardHeader>
        
        <CardContent className="p-1 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 1.2, 
              delay: 0.5,
              ease: "easeOut"
            }}
          >
            <ChartContainer config={chartConfig} className="w-full h-32 sm:h-36 lg:h-40">
              <LineChart 
                data={processedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                onMouseMove={(state) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    setHoveredIndex(state.activeTooltipIndex);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredIndex(null);
                }}
              >
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#7E659E" 
                  fontSize={10}
                  fontFamily="monospace"
                  tick={{ fill: '#7E659E' }} 
                  angle={-45}
                  textAnchor="end"
                  height={40}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#7E659E" 
                  fontSize={12}
                  fontFamily="monospace"
                  tick={{ fill: '#7E659E' }} 
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(value) => [value, 'Notifications']}
                  cursor={{ stroke: '#46798E', strokeWidth: 1 }} 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    borderColor: '#46798E',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                  labelStyle={{ 
                    color: '#010741',  
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                  itemStyle={{ 
                    color: '#010741',  
                    fontSize: '11px'
                  }}
                />
                <Line 
                  type="monotone"
                  dataKey="total_entities"
                  stroke="#46798E" 
                  strokeWidth={2}
                  dot={{ stroke: '#46798E', strokeWidth: 2, r: 3, fill: 'white' }} 
                  activeDot={{ r: 5, stroke: '#46798E', strokeWidth: 2, fill: 'white' }} 
                  animationDuration={2500}
                />
              </LineChart>
            </ChartContainer>
          </motion.div>
      
        </CardContent>
        
      </Card>
    </motion.div>
  );
};

export default SEBIDailyTrendChart;