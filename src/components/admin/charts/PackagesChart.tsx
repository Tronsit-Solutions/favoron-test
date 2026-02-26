import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
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
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              <Bar
                dataKey="completedPackages"
                name="Completados"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="pendingPackages"
                name="En Proceso"
                fill="hsl(var(--chart-3))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="cancelledPackages"
                name="Cancelados"
                fill="hsl(var(--chart-5))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
