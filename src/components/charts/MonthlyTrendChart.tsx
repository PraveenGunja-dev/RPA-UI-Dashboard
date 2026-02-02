import { useState } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
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
import { getYear } from "date-fns";

interface MonthlyData {
  month: string;
  entity_name: string;
  total_notifications: number;
  year?: string;
}

interface MonthlyTrendChartProps {
  data: MonthlyData[];
}

const chartConfig = {
  total_notifications: {
    label: "Notifications",
    color: "#E4A6CB",
  },
} satisfies ChartConfig;

const MonthlyTrendChart = ({ data }: MonthlyTrendChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Process data to include month-year display
  const processedData = data.map(item => ({
    ...item,
    monthYear: item.year ? `${item.month} ${item.year}` : item.month,
    displayMonth: item.year ? `${item.month} ${item.year}` : item.month
  }));

  // Type-safe calculations with proper null/undefined handling
  const totalNotifications = data.reduce((sum, item) => sum + (item.total_notifications || 0), 0);
  const averageNotifications = data.length > 0 ? Math.round(totalNotifications / data.length) : 0;
  const maxNotifications = data.length > 0 ? Math.max(...data.map(item => item.total_notifications || 0)) : 0;
  const entityName = data.length > 0 ? data[0]?.entity_name || "Unknown" : "No Data";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
      }}
      transition={{ 
        duration: 1.0,
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
              <CardTitle className="text-lg font-semibold " style={{ color: '#010741' }}>
                {getYear(new Date())} Monthly Analysis 
              </CardTitle>
              <CardDescription className="text-xs" style={{ color: 'rgba(1, 7, 65, 0.8)' }}>
                Notifications spectrum by entity timeline
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
              delay: 0.3,
              ease: "easeOut"
            }}
          >
            <ChartContainer config={chartConfig} className="w-full h-32 sm:h-36 lg:h-40">
              <BarChart 
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
                  dataKey="displayMonth" 
                  stroke="#7E659E"
                  fontSize={12}
                  fontFamily="monospace"
                  tick={{ fill: '#7E659E' }}
                />
                <YAxis 
                  stroke="#7E659E"
                  fontSize={12}
                  fontFamily="monospace"
                  tick={{ fill: '#7E659E' }}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return data.monthYear || label;
                    }
                    return label;
                  }}
                  cursor={{ stroke: '#E4A6CB', strokeWidth: 1 }}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    borderColor: '#E4A6CB',
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
                <Bar 
                  dataKey="total_notifications"
                  fill="#E4A6CB"
                  radius={[4, 4, 0, 0]}
                  animationDuration={2500}
                />
              </BarChart>
            </ChartContainer>
          </motion.div>
      
        </CardContent>
        
        {/* Data analytics display removed */}
      </Card>
    </motion.div>
  );
};

export default MonthlyTrendChart;
