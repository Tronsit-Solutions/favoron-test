import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Package, TrendingUp } from "lucide-react";

interface PackagesChartProps {
  data: Array<{
    monthLabel: string;
    totalPackages: number;
    completedPackages: number;
    pendingPackages: number;
    cancelledPackages: number;
    conversionRate: number;
  }>;
}

const chartConfig = {
  completedPackages: {
    label: "Completados",
    color: "hsl(var(--chart-1))",
  },
  pendingPackages: {
    label: "En Proceso",
    color: "hsl(var(--chart-3))",
  },
  cancelledPackages: {
    label: "Cancelados",
    color: "hsl(var(--chart-5))",
  },
};

export const PackagesChart = ({ data }: PackagesChartProps) => {
  const totalCompleted = data.reduce((acc, d) => acc + d.completedPackages, 0);
  const totalPackages = data.reduce((acc, d) => acc + d.totalPackages, 0);
  const overallConversion = totalPackages > 0 ? (totalCompleted / totalPackages * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Evolución de Solicitudes
            </CardTitle>
            <CardDescription>
              Paquetes por estado mensual
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{overallConversion.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Tasa de completación</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="cancelledGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0.1}/>
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
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="completedPackages"
                name="Completados"
                stackId="1"
                stroke="hsl(var(--chart-1))"
                fill="url(#completedGradient)"
              />
              <Area
                type="monotone"
                dataKey="pendingPackages"
                name="En Proceso"
                stackId="1"
                stroke="hsl(var(--chart-3))"
                fill="url(#pendingGradient)"
              />
              <Area
                type="monotone"
                dataKey="cancelledPackages"
                name="Cancelados"
                stackId="1"
                stroke="hsl(var(--chart-5))"
                fill="url(#cancelledGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
