import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { format, parseISO } from "date-fns";
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
  total_notifications: number;
}

interface DailyTrendChartProps {
  data: DailyData[];
}

const chartConfig = {
  total_notifications: {
    label: "Notifications",
    color: "#46798E",
  },
} satisfies ChartConfig;

const DailyTrendChart = ({ data }: DailyTrendChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
      }}
      transition={{ 
        duration: 1.0, 
        delay: 0.6,
      }}
      className="w-full"
    >
      <Card className="w-full" style={{
        background: "white",
        border: 'none',
        boxShadow: 'none'
      }}>
        <CardHeader className="relative">
          <div>
            <CardTitle className="text-lg font-semibold " style={{ color: '#010741' }}>
              Daily Analysis Trend
            </CardTitle>
            <CardDescription className="text-xs" style={{ color: 'rgba(1, 7, 65, 0.8)' }}>
              Real-time notification count progression
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="p-1">
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 1.2, 
              delay: 0.9,
              ease: "easeOut"
            }}
          >
            <ChartContainer config={chartConfig} className="w-full h-32 sm:h-36 lg:h-40">
              <LineChart 
                data={data}
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
                  dataKey="date" 
                  stroke="#7E659E"
                  fontSize={12}
                  fontFamily="monospace"
                  tick={{ fill: '#7E659E' }}
                  tickFormatter={(value) => {
                    try {
                      return format(parseISO(value), 'MMM dd');
                    } catch {
                      return value;
                    }
                  }}
                />
                <YAxis 
                  stroke="#7E659E"
                  fontSize={12}
                  fontFamily="monospace"
                  tick={{ fill: '#7E659E' }}
                  domain={[0, 2]}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTooltipContent 
                    labelFormatter={(value) => {
                      try {
                        return `Date: ${format(parseISO(value as string), 'MMM dd, yyyy')}`;
                      } catch {
                        return `Date: ${value}`;
                      }
                    }}
                  />}
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
                  dataKey="total_notifications"
                  stroke="#46798E"
                  strokeWidth={3}
                  dot={{ fill: '#46798E', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#46798E', strokeWidth: 2 }}
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

export default DailyTrendChart;