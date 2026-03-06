import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { AcquisitionChannelData } from "@/hooks/useAcquisitionAnalytics";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AcquisitionChartProps {
  data: AcquisitionChannelData[];
  summaryKPIs: {
    bestConversionChannel: string | null;
    bestConversionRate?: number;
    bestVolumeChannel: string | null;
    bestVolumeCount?: number;
    bestRevenueChannel: string | null;
    bestRevenueAmount?: number;
    totalServiceFee: number;
  };
}

const CHANNEL_COLORS: Record<string, string> = {
  tiktok: "hsl(var(--chart-1))",
  instagram_ads: "hsl(var(--chart-2))",
  facebook_ads: "hsl(var(--chart-3))",
  instagram_facebook_ads: "hsl(var(--chart-4))",
  friend_referral: "hsl(var(--chart-5))",
  reels: "hsl(var(--primary))",
  other: "hsl(var(--muted-foreground))",
  null: "hsl(var(--muted-foreground))",
};

const chartConfig = {
  totalServiceFee: {
    label: "Service Fee",
    color: "hsl(var(--primary))",
  },
};

export const AcquisitionChart = ({ data, summaryKPIs }: AcquisitionChartProps) => {
  if (data.length === 0) {
    return null;
  }

  const formatCurrency = (value: number) => `Q${value.toFixed(2)}`;
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium">Mejor Conversión</span>
            </div>
            <p className="text-lg font-bold text-green-800 dark:text-green-300 mt-1">
              {summaryKPIs.bestConversionChannel || 'N/A'}
            </p>
            <p className="text-sm text-green-600 dark:text-green-500">
              {formatPercent(summaryKPIs.bestConversionRate || 0)} de usuarios pagaron
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Mayor Volumen</span>
            </div>
            <p className="text-lg font-bold text-blue-800 dark:text-blue-300 mt-1">
              {summaryKPIs.bestVolumeChannel || 'N/A'}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-500">
              {summaryKPIs.bestVolumeCount || 0} usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Mayor Revenue</span>
            </div>
            <p className="text-lg font-bold text-purple-800 dark:text-purple-300 mt-1">
              {summaryKPIs.bestRevenueChannel || 'N/A'}
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-500">
              {formatCurrency(summaryKPIs.bestRevenueAmount || 0)} en service fees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Análisis de Adquisición por Canal
              </CardTitle>
              <CardDescription>
                Rendimiento de cada canal de marketing en términos de usuarios, conversión e ingresos
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              Total: {formatCurrency(summaryKPIs.totalServiceFee)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bar Chart */}
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data} 
                layout="vertical" 
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `Q${value}`}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="channelLabel" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as AcquisitionChannelData;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                        <p className="font-semibold mb-2">{item.channelLabel}</p>
                        <div className="space-y-1 text-muted-foreground">
                          <p>Usuarios: <span className="font-medium text-foreground">{item.totalUsers}</span></p>
                          <p>Paquetes Pagados: <span className="font-medium text-foreground">{item.paidPackages}</span></p>
                          <p>Conversión: <span className="font-medium text-foreground">{formatPercent(item.conversionRate)}</span></p>
                          <p>Service Fee: <span className="font-medium text-foreground">{formatCurrency(item.totalServiceFee)}</span></p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="totalServiceFee" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHANNEL_COLORS[entry.channel] || "hsl(var(--primary))"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Detail Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-center">Usuarios</TableHead>
                  <TableHead className="text-center">Usuarios Monetizados</TableHead>
                  <TableHead className="text-center">Tasa Conversión</TableHead>
                  <TableHead className="text-center">Paquetes Pagados</TableHead>
                  <TableHead className="text-right">Service Fee</TableHead>
                  <TableHead className="text-right">Revenue Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((channel) => (
                  <TableRow key={channel.channel}>
                    <TableCell className="font-medium">{channel.channelLabel}</TableCell>
                    <TableCell className="text-center">{channel.totalUsers}</TableCell>
                    <TableCell className="text-center">{channel.monetizedUsers}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={channel.conversionRate >= 50 ? "default" : channel.conversionRate >= 25 ? "secondary" : "outline"}
                        className="font-mono"
                      >
                        {formatPercent(channel.conversionRate)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{channel.paidPackages}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(channel.totalServiceFee)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatCurrency(channel.totalRevenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
