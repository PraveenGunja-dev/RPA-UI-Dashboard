import { useState } from "react";
import { motion } from "framer-motion";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
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

interface WeeklyTrendChartProps {
  data: WeeklyData[];
}

const COLORS = ["#7E659E", "#6196FE", "#1E40AF", "#CEA7C2", "#9F86C0", "#5E548E", "#BE95C4", "#E0B1CB"];

const chartConfig = {
  total_notifications: {
    label: "Notifications",
    color: "#7E659E",
  },
} satisfies ChartConfig;

const WeeklyTrendChart = ({ data }: WeeklyTrendChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Aggregate data by entity for the pie chart
  const aggregatedData = data.reduce((acc, curr) => {
    // Only include entities with notifications > 0 to avoid cluttering the chart
    if (curr.total_notifications > 0) {
      acc.push({
        week: curr.week,
        total_notifications: curr.total_notifications
      });
    }
    return acc;
  }, [] as { week: string; total_notifications: number }[]);

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
      }}
      transition={{ 
        duration: 1.0, 
        delay: 0.2,
      }}
      className="w-full h-full"
    >
      <Card className="w-full h-full" style={{
        background: "white",
        border: 'none',
        boxShadow: "none"
      }}>
        <CardHeader className="relative pb-1">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold font-mono" style={{ color: '#010741' }}>
                Weekly Trend
              </CardTitle>
              <CardDescription className="text-xs font-mono" style={{ color: 'rgba(1, 7, 65, 0.8)' }}>
                Notifications by week (latest month)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-1 flex items-center justify-center h-[calc(100%-40px)]">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.9, 
              delay: 0.4,
              ease: "easeOut"
            }}
            className="w-full h-full"
          >
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aggregatedData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="total_notifications"
                    nameKey="week"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                  >
                    {aggregatedData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        stroke={index === activeIndex ? "#000" : "#fff"}
                        strokeWidth={index === activeIndex ? 2 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<ChartTooltipContent />}
                    cursor={{ stroke: '#7E659E', strokeWidth: 1 }}
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
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    content={(props) => {
                      const { payload } = props;
                      return (
                        <ul className="flex flex-wrap justify-center gap-2 mt-2 text-xs">
                          {payload && payload.map((entry, index) => (
                            <li 
                              key={`item-${index}`} 
                              className="flex items-center"
                              style={{ color: '#010741' }}
                            >
                              <div 
                                className="w-3 h-3 mr-1 rounded-full" 
                                style={{ backgroundColor: entry.color }}
                              />
                              <span>{entry.value}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WeeklyTrendChart;