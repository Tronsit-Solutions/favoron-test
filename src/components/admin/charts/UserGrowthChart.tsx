import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Users, TrendingUp } from "lucide-react";

interface UserGrowthChartProps {
  data: Array<{
    monthLabel: string;
    newUsers: number;
    accumulatedUsers: number;
  }>;
}

const chartConfig = {
  newUsers: {
    label: "Nuevos Usuarios",
    color: "hsl(var(--primary))",
  },
  accumulatedUsers: {
    label: "Total Acumulado",
    color: "hsl(var(--chart-2))",
  },
};

export const UserGrowthChart = ({ data }: UserGrowthChartProps) => {
  const latestMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  const growth = previousMonth && previousMonth.newUsers > 0
    ? ((latestMonth?.newUsers || 0) - previousMonth.newUsers) / previousMonth.newUsers * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Crecimiento de Usuarios
            </CardTitle>
            <CardDescription>
              Evolución mensual de registros y usuarios totales
            </CardDescription>
          </div>
          {growth !== 0 && (
            <div className={`flex items-center gap-1 text-sm font-medium ${growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`h-4 w-4 ${growth < 0 ? 'rotate-180' : ''}`} />
              {growth > 0 ? '+' : ''}{growth.toFixed(1)}% vs mes anterior
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="newUsers"
                name="Nuevos Usuarios"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="accumulatedUsers"
                name="Total Acumulado"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
