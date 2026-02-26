import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface ServiceFeeGrowthChartProps {
  data: Array<{
    monthLabel: string;
    favoronRevenue: number;
  }>;
}

const chartConfig = {
  favoronRevenue: {
    label: "Service Fee Mensual",
    color: "hsl(var(--chart-3))",
  },
};

export const ServiceFeeGrowthChart = ({ data }: ServiceFeeGrowthChartProps) => {
  const totalRevenue = data.reduce((sum, d) => sum + d.favoronRevenue, 0);
  const lastMonth = data[data.length - 1]?.favoronRevenue || 0;
  const prevMonth = data[data.length - 2]?.favoronRevenue || 0;
  const momGrowth = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;
  const isPositive = momGrowth >= 0;

  const hasData = data.some(d => d.favoronRevenue > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Crecimiento de Ingresos
          </CardTitle>
          <CardDescription>Sin datos de ingresos disponibles</CardDescription>
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
              <Wallet className="h-5 w-5 text-primary" />
              Crecimiento de Ingresos
            </CardTitle>
            <CardDescription>Service fee mensual (GTQ)</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">Q{totalRevenue.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
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
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `Q${(value / 1000).toFixed(0)}k`}
                className="text-muted-foreground"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-medium">Q{Number(value).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    )}
                  />
                }
              />
              <Bar
                dataKey="favoronRevenue"
                fill="hsl(var(--chart-3))"
                radius={[4, 4, 0, 0]}
                name="Service Fee Mensual"
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
