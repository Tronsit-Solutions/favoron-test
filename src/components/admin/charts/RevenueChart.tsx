import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
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
  favoronRevenue: {
    label: "Ingresos Favorón",
    color: "hsl(var(--primary))",
  },
  travelerTips: {
    label: "Propinas Viajeros",
    color: "hsl(142, 76%, 36%)", // Verde esmeralda
  },
  gmv: {
    label: "GMV Total",
    color: "hsl(var(--foreground))",
  },
};

export const RevenueChart = ({ data }: RevenueChartProps) => {
  const totalRevenue = data.reduce((acc, d) => acc + d.favoronRevenue, 0);
  const totalTips = data.reduce((acc, d) => acc + d.travelerTips, 0);
  const totalGMV = data.reduce((acc, d) => acc + d.gmv, 0);
  
  const latestMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  const revenueGrowth = previousMonth && previousMonth.favoronRevenue > 0
    ? ((latestMonth?.favoronRevenue || 0) - previousMonth.favoronRevenue) / previousMonth.favoronRevenue * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Distribución de Ingresos
            </CardTitle>
            <CardDescription>
              Cómo se distribuye el GMV entre Favorón y viajeros
            </CardDescription>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-lg font-bold text-primary">Q{totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Ingresos Favorón</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-600">Q{totalTips.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Propinas Viajeros</div>
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
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="monthLabel" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        favoronRevenue: "Ingresos Favorón",
                        travelerTips: "Propinas Viajeros",
                        gmv: "GMV Total"
                      };
                      return [`Q${value.toLocaleString()}`, labels[name] || name];
                    }}
                  />
                }
              />
              <Legend 
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    favoronRevenue: "Ingresos Favorón",
                    travelerTips: "Propinas Viajeros",
                    gmv: "GMV Total"
                  };
                  return labels[value] || value;
                }}
              />
              {/* Barras apiladas: Favorón + Propinas */}
              <Bar
                dataKey="favoronRevenue"
                stackId="revenue"
                fill="hsl(var(--primary))"
                radius={[0, 0, 0, 0]}
                name="favoronRevenue"
              />
              <Bar
                dataKey="travelerTips"
                stackId="revenue"
                fill="hsl(142, 76%, 36%)"
                radius={[4, 4, 0, 0]}
                name="travelerTips"
              />
              {/* Línea de GMV total */}
              <Line
                type="monotone"
                dataKey="gmv"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--foreground))", r: 4 }}
                activeDot={{ r: 6 }}
                name="gmv"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Leyenda explicativa */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-primary"></div>
              <span>Ingresos Favorón (serviceFee)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(142, 76%, 36%)' }}></div>
              <span>Propinas Viajeros</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-foreground"></div>
              <span>GMV Total (línea)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
