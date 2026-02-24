import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CACChannelData } from "@/hooks/useCACAnalytics";

interface FunnelChartProps {
  data: CACChannelData[];
  mode?: 'shopper' | 'traveler';
}

const SHOPPER_COLORS = {
  registered: "hsl(var(--chart-1))",
  active: "hsl(var(--chart-2))",
  monetized: "hsl(var(--chart-3))",
};

const TRAVELER_COLORS = {
  withTrip: "hsl(var(--chart-1))",
  active: "hsl(var(--chart-4))",
  productive: "hsl(var(--chart-5))",
};

const shopperConfig = {
  registered: { label: "Registrados", color: SHOPPER_COLORS.registered },
  active: { label: "Activos", color: SHOPPER_COLORS.active },
  monetized: { label: "Monetizados", color: SHOPPER_COLORS.monetized },
};

const travelerConfig = {
  withTrip: { label: "Con Trip", color: TRAVELER_COLORS.withTrip },
  active: { label: "Activos", color: TRAVELER_COLORS.active },
  productive: { label: "Productivos", color: TRAVELER_COLORS.productive },
};

export const FunnelChart = ({ data, mode = 'shopper' }: FunnelChartProps) => {
  const topChannels = data.slice(0, 6);

  if (mode === 'traveler') {
    const chartData = topChannels
      .filter(ch => ch.travelerUsers > 0)
      .map((channel) => ({
        name: channel.channelLabel,
        withTrip: channel.travelerUsers,
        active: channel.activeTravelers,
        productive: channel.productiveTravelers,
      }));

    if (chartData.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funnel Viajeros por Canal</CardTitle>
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
          <CardTitle className="text-base">Funnel Viajeros por Canal</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={travelerConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="withTrip" fill={TRAVELER_COLORS.withTrip} radius={[0, 4, 4, 0]} name="Con Trip">
                  <LabelList dataKey="withTrip" position="right" className="fill-foreground text-xs" />
                </Bar>
                <Bar dataKey="active" fill={TRAVELER_COLORS.active} radius={[0, 4, 4, 0]} name="Activos">
                  <LabelList dataKey="active" position="right" className="fill-foreground text-xs" />
                </Bar>
                <Bar dataKey="productive" fill={TRAVELER_COLORS.productive} radius={[0, 4, 4, 0]} name="Productivos">
                  <LabelList dataKey="productive" position="right" className="fill-foreground text-xs" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: TRAVELER_COLORS.withTrip }} />
              <span className="text-sm">Con Trip</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: TRAVELER_COLORS.active }} />
              <span className="text-sm">Activos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: TRAVELER_COLORS.productive }} />
              <span className="text-sm">Productivos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Shopper mode (default)
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
          <CardTitle className="text-base">Funnel Shoppers por Canal</CardTitle>
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
        <CardTitle className="text-base">Funnel Shoppers por Canal</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={shopperConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="registered" fill={SHOPPER_COLORS.registered} radius={[0, 4, 4, 0]} name="Registrados">
                <LabelList dataKey="registered" position="right" className="fill-foreground text-xs" />
              </Bar>
              <Bar dataKey="active" fill={SHOPPER_COLORS.active} radius={[0, 4, 4, 0]} name="Activos">
                <LabelList dataKey="active" position="right" className="fill-foreground text-xs" />
              </Bar>
              <Bar dataKey="monetized" fill={SHOPPER_COLORS.monetized} radius={[0, 4, 4, 0]} name="Monetizados">
                <LabelList dataKey="monetized" position="right" className="fill-foreground text-xs" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SHOPPER_COLORS.registered }} />
            <span className="text-sm">Registrados</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SHOPPER_COLORS.active }} />
            <span className="text-sm">Activos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SHOPPER_COLORS.monetized }} />
            <span className="text-sm">Monetizados</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
