import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CACChannelData } from "@/hooks/useCACAnalytics";

interface FunnelChartProps {
  data: CACChannelData[];
}

const COLORS = {
  registered: "hsl(var(--chart-1))",
  active: "hsl(var(--chart-2))",
  monetized: "hsl(var(--chart-3))",
};

const chartConfig = {
  registered: { label: "Registrados", color: COLORS.registered },
  active: { label: "Activos", color: COLORS.active },
  monetized: { label: "Monetizados", color: COLORS.monetized },
};

export const FunnelChart = ({ data }: FunnelChartProps) => {
  // Get top 6 channels by users for chart
  const topChannels = data.slice(0, 6);

  const chartData = topChannels.map((channel) => ({
    name: channel.channelLabel,
    registered: channel.totalUsers,
    active: channel.activeUsers,
    monetized: channel.monetizedUsers,
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funnel por Canal</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          No hay datos disponibles
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Funnel de Usuarios por Canal</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="registered" fill={COLORS.registered} radius={[0, 4, 4, 0]} name="Registrados">
                <LabelList dataKey="registered" position="right" className="fill-foreground text-xs" />
              </Bar>
              <Bar dataKey="active" fill={COLORS.active} radius={[0, 4, 4, 0]} name="Activos">
                <LabelList dataKey="active" position="right" className="fill-foreground text-xs" />
              </Bar>
              <Bar dataKey="monetized" fill={COLORS.monetized} radius={[0, 4, 4, 0]} name="Monetizados">
                <LabelList dataKey="monetized" position="right" className="fill-foreground text-xs" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.registered }} />
            <span className="text-sm">Registrados</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.active }} />
            <span className="text-sm">Activos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.monetized }} />
            <span className="text-sm">Monetizados</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
