import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useMemo } from "react";

interface GMVChartProps {
  data: Array<{
    monthLabel: string;
    gmv: number;
    favoronRevenue: number;
    travelerTips: number;
  }>;
}

const chartConfig = {
  gmv: {
    label: "GMV Mensual",
    color: "hsl(var(--chart-2))",
  },
  accumulated: {
    label: "Acumulado",
    color: "hsl(var(--chart-1))",
  },
};

export const GMVChart = ({ data }: GMVChartProps) => {
  const chartData = useMemo(() => {
    let acc = 0;
    return data.map(d => {
      acc += d.gmv;
      return { ...d, accumulatedGMV: acc };
    });
  }, [data]);

  const totalGMV = chartData[chartData.length - 1]?.accumulatedGMV || 0;
  const lastMonth = data[data.length - 1]?.gmv || 0;
  const prevMonth = data[data.length - 2]?.gmv || 0;
  const momGrowth = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;
  const isPositive = momGrowth >= 0;

  const hasData = data.some(d => d.gmv > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Evolución del GMV
          </CardTitle>
          <CardDescription>Sin datos de GMV disponibles</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Evolución del GMV
            </CardTitle>
            <CardDescription>Valor bruto de paquetes pagados (USD)</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${totalGMV.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {isPositive ? '+' : ''}{momGrowth.toFixed(1)}% MoM
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                className="text-muted-foreground"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `Q${(value / 1000).toFixed(0)}k`}
                className="text-muted-foreground"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span className="font-medium">
                        Q{Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  />
                }
              />
              <Bar
                yAxisId="left"
                dataKey="gmv"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
                name="GMV Mensual"
                opacity={0.8}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="accumulatedGMV"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Total Acumulado"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
