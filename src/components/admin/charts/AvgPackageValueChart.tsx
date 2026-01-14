import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface AvgPackageValueChartProps {
  data: Array<{
    monthLabel: string;
    avgPackageValue: number;
    completedPackages: number;
  }>;
  overallAvg: number;
}

const chartConfig = {
  avgPackageValue: {
    label: "Valor Promedio",
    color: "hsl(var(--chart-1))",
  },
};

export const AvgPackageValueChart = ({ data, overallAvg }: AvgPackageValueChartProps) => {
  // Filter out months with no completed packages
  const filteredData = data.filter(d => d.completedPackages > 0);
  
  if (filteredData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Valor Promedio por Paquete
          </CardTitle>
          <CardDescription>Sin datos de paquetes completados</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate trend (comparing last month to first month with data)
  const firstValue = filteredData[0]?.avgPackageValue || 0;
  const lastValue = filteredData[filteredData.length - 1]?.avgPackageValue || 0;
  const trend = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  const isPositiveTrend = trend >= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Valor Promedio por Paquete
            </CardTitle>
            <CardDescription>Evolución del ticket promedio mensual</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">Q{overallAvg.toFixed(0)}</div>
            <div className={`flex items-center gap-1 text-sm ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveTrend ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {isPositiveTrend ? '+' : ''}{trend.toFixed(1)}% tendencia
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="monthLabel" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `Q${value}`}
                className="text-muted-foreground"
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name) => (
                      <span className="font-medium">Q{Number(value).toFixed(2)}</span>
                    )}
                  />
                }
              />
              <ReferenceLine 
                y={overallAvg} 
                stroke="hsl(var(--chart-4))" 
                strokeDasharray="5 5"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="avgPackageValue" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={3}
                dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "hsl(var(--chart-1))" }}
                name="Valor Promedio"
              />
              <Legend 
                formatter={(value) => {
                  if (value === "Valor Promedio") {
                    return <span className="text-sm">Valor Promedio Mensual</span>;
                  }
                  return value;
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-[hsl(var(--chart-1))]" />
            <span>Valor Mensual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 border-t-2 border-dashed border-[hsl(var(--chart-4))]" />
            <span>Promedio General (Q{overallAvg.toFixed(0)})</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
