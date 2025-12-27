import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Cell } from "recharts";
import { Plane, CheckCircle } from "lucide-react";

interface TripsChartProps {
  data: Array<{
    monthLabel: string;
    totalTrips: number;
    approvedTrips: number;
    completedTrips: number;
    tripApprovalRate: number;
  }>;
}

const chartConfig = {
  totalTrips: {
    label: "Total Viajes",
    color: "hsl(var(--muted-foreground))",
  },
  approvedTrips: {
    label: "Aprobados",
    color: "hsl(var(--primary))",
  },
  completedTrips: {
    label: "Completados",
    color: "hsl(var(--chart-1))",
  },
};

export const TripsChart = ({ data }: TripsChartProps) => {
  const totalTrips = data.reduce((acc, d) => acc + d.totalTrips, 0);
  const totalApproved = data.reduce((acc, d) => acc + d.approvedTrips, 0);
  const approvalRate = totalTrips > 0 ? (totalApproved / totalTrips * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              Viajes Registrados
            </CardTitle>
            <CardDescription>
              Comparativa de viajes totales vs aprobados
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">{approvalRate.toFixed(1)}% aprobación</span>
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
                dataKey="totalTrips" 
                name="Total Viajes"
                fill="hsl(var(--muted-foreground))" 
                radius={[4, 4, 0, 0]}
                opacity={0.5}
              />
              <Bar 
                dataKey="approvedTrips" 
                name="Aprobados"
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="completedTrips" 
                name="Completados"
                fill="hsl(var(--chart-1))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
