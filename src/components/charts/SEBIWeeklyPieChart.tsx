import { useState } from "react";
import { motion } from "framer-motion";
import { Pie, PieChart, Cell, Tooltip, Legend } from "recharts";
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

interface WeeklyData {
  week: string;
  total_notifications: number;
}

interface SEBIWeeklyPieChartProps {
  data: WeeklyData[];
}

const chartConfig = {
  total_notifications: {
    label: "Notifications",
    color: "#7E659E", // Changed from #BD3861 to match BSE Alerts
  },
} satisfies ChartConfig;

// Generate colors for pie chart segments (using BSE Alerts color scheme)
const generateColors = (count: number): string[] => {
  // Using colors from the BSE Alerts palette
  const COLORS = ["#7E659E", "#6196FE", "#1E40AF", "#CEA7C2", "#9F86C0", "#5E548E", "#BE95C4", "#E0B1CB"];
  const colors = [];
  
  for (let i = 0; i < count; i++) {
    colors.push(COLORS[i % COLORS.length]);
  }
  
  return colors;
};

const SEBIWeeklyPieChart = ({ data }: SEBIWeeklyPieChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Generate colors for the data
  const colors = generateColors(data.length);

  // Type-safe calculations with proper null/undefined handling
  const totalNotifications = data.reduce((sum, item) => sum + (item.total_notifications || 0), 0);
  const averageNotifications = data.length > 0 ? Math.round(totalNotifications / data.length) : 0;
  const maxNotifications = data.length > 0 ? Math.max(...data.map(item => item.total_notifications || 0)) : 0;

  // Only show legend for top 5 items to avoid clutter
  const legendData = data.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
      }}
      transition={{ 
        duration: 1.0,
        delay: 0.1
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
                Weekly Distribution
              </CardTitle>
              <CardDescription className="text-xs" style={{ color: 'rgba(1, 7, 65, 0.8)' }}>
                Notification distribution by week (Last {data.length} weeks) - Valid PDF Links Only
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
              delay: 0.4,
              ease: "easeOut"
            }}
          >
            <ChartContainer config={chartConfig} className="w-full h-32 sm:h-36 lg:h-40">
              <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={60}
                  fill="#7E659E"
                  dataKey="total_notifications"
                  nameKey="week"
                  onMouseMove={(data, index) => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  animationDuration={2500}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colors[index % colors.length]} 
                      stroke={index === hoveredIndex ? '#000000' : 'none'}
                      strokeWidth={index === hoveredIndex ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(value) => [value, 'Notifications']}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    borderColor: '#7E659E',
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
                <Legend 
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  content={(props) => {
                    const { payload } = props;
                    return (
                      <ul className="text-xs" style={{ color: '#010741' }}>
                        {legendData.map((entry, index) => (
                          <li key={`legend-${index}`} className="flex items-center mb-1">
                            <div 
                              className="w-3 h-3 mr-2" 
                              style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <span>{entry.week}: {entry.total_notifications}</span>
                          </li>
                        ))}
                        {data.length > 5 && (
                          <li className="flex items-center mt-2 font-semibold">
                            <span>+ {data.length - 5} more weeks</span>
                          </li>
                        )}
                      </ul>
                    );
                  }}
                />
              </PieChart>
            </ChartContainer>
          </motion.div>
      
        </CardContent>
        
      </Card>
    </motion.div>
  );
};

export default SEBIWeeklyPieChart;