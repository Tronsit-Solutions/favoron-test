import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface ServiceFeeGrowthChartProps {
  data: Array<{
    monthLabel: string;
    favoronRevenue: number;
    netFavoronRevenue?: number;
  }>;
}

const chartConfig = {
  displayRevenue: {
    label: "Service Fee Neto Mensual",
    color: "hsl(var(--chart-3))",
  },
};

export const ServiceFeeGrowthChart = ({ data }: ServiceFeeGrowthChartProps) => {
  const chartData = data.map((item) => ({
    ...item,
    displayRevenue: item.netFavoronRevenue ?? item.favoronRevenue,
  }));

  const totalRevenue = chartData.reduce((sum, d) => sum + d.displayRevenue, 0);
  const lastMonth = chartData[chartData.length - 1]?.displayRevenue || 0;
  const prevMonth = chartData[chartData.length - 2]?.displayRevenue || 0;
  const momGrowth = Math.abs(prevMonth) > 0 ? ((lastMonth - prevMonth) / Math.abs(prevMonth)) * 100 : 0;
  const isPositive = momGrowth >= 0;

  const hasData = chartData.some(d => d.displayRevenue !== 0);

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
            <CardDescription>Service fee neto mensual (GTQ)</CardDescription>
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
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                dataKey="displayRevenue"
                fill="hsl(var(--chart-3))"
                radius={[4, 4, 0, 0]}
                name="Service Fee Neto Mensual"
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
