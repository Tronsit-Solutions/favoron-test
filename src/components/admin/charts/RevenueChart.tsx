import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, TrendingUp } from "lucide-react";

interface RevenueChartProps {
  data: Array<{
    monthLabel: string;
    gmv: number;
    favoronRevenue: number;
    travelerTips: number;
    profitMargin: number;
  }>;
}

const formatCurrency = (value: number) => {
  if (value >= 1000) {
    return `Q${(value / 1000).toFixed(1)}k`;
  }
  return `Q${value.toFixed(0)}`;
};

const chartConfig = {
  gmv: {
    label: "GMV Total",
    color: "hsl(var(--chart-2))",
  },
  favoronRevenue: {
    label: "Ingresos Favorón",
    color: "hsl(var(--primary))",
  },
  travelerTips: {
    label: "Propinas Viajeros",
    color: "hsl(var(--chart-3))",
  },
};

export const RevenueChart = ({ data }: RevenueChartProps) => {
  const totalRevenue = data.reduce((acc, d) => acc + d.favoronRevenue, 0);
  const totalGMV = data.reduce((acc, d) => acc + d.gmv, 0);
  const overallMargin = totalGMV > 0 ? (totalRevenue / totalGMV * 100) : 0;
  
  const latestMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  const revenueGrowth = previousMonth && previousMonth.favoronRevenue > 0
    ? ((latestMonth?.favoronRevenue || 0) - previousMonth.favoronRevenue) / previousMonth.favoronRevenue * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Evolución de Ingresos
            </CardTitle>
            <CardDescription>
              GMV, ingresos de Favorón y propinas a viajeros
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-lg font-bold text-primary">Q{totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Ingresos totales</div>
            </div>
            {revenueGrowth !== 0 && (
              <div className={`flex items-center gap-1 text-sm font-medium ${revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className={`h-4 w-4 ${revenueGrowth < 0 ? 'rotate-180' : ''}`} />
                {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="monthLabel" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: number) => [`Q${value.toLocaleString()}`, '']}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="gmv"
                name="GMV Total"
                fill="url(#gmvGradient)"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="favoronRevenue"
                name="Ingresos Favorón"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="travelerTips"
                name="Propinas Viajeros"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "hsl(var(--chart-3))", r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
