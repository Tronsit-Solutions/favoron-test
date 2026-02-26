import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CACChannelData } from "@/hooks/useCACAnalytics";

interface CACTableProps {
  data: CACChannelData[];
  mode?: 'shopper' | 'traveler' | 'general';
}

const formatCurrency = (value: number) => `Q${value.toFixed(2)}`;
const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const formatRatio = (value: number) => {
  if (value === Infinity) return "∞";
  if (value === 0) return "-";
  return `${value.toFixed(2)}x`;
};

export const CACTable = ({ data, mode = 'shopper' }: CACTableProps) => {
  const getRatioBadge = (ratio: number) => {
    if (ratio === Infinity || ratio >= 3) {
      return <Badge variant="default" className="bg-green-500/20 text-green-700 hover:bg-green-500/20">Excelente</Badge>;
    }
    if (ratio >= 2) {
      return <Badge variant="default" className="bg-blue-500/20 text-blue-700 hover:bg-blue-500/20">Bueno</Badge>;
    }
    if (ratio >= 1) {
      return <Badge variant="default" className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/20">Regular</Badge>;
    }
    if (ratio > 0) {
      return <Badge variant="default" className="bg-red-500/20 text-red-700 hover:bg-red-500/20">Crítico</Badge>;
    }
    return <Badge variant="outline">Sin datos</Badge>;
  };

  if (mode === 'general') {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Canal</TableHead>
              <TableHead className="text-right">Registrados</TableHead>
              <TableHead className="text-right">Activos</TableHead>
              <TableHead className="text-right">Monetizados</TableHead>
              <TableHead className="text-right">% Conversión</TableHead>
              <TableHead className="text-right">Inversión Total</TableHead>
              <TableHead className="text-right">CAC</TableHead>
              <TableHead className="text-right">LTV</TableHead>
              <TableHead className="text-center">LTV/CAC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((channel) => {
              const generalCAC = channel.monetizedUsers > 0 && channel.totalInvestment > 0
                ? channel.totalInvestment / channel.monetizedUsers : 0;
              const generalLtvCac = generalCAC > 0 ? channel.avgLTV / generalCAC : channel.avgLTV > 0 ? Infinity : 0;

              return (
                <TableRow key={channel.channel}>
                  <TableCell className="font-medium">{channel.channelLabel}</TableCell>
                  <TableCell className="text-right">{channel.totalUsers}</TableCell>
                  <TableCell className="text-right">{channel.activeUsers}</TableCell>
                  <TableCell className="text-right">{channel.monetizedUsers}</TableCell>
                  <TableCell className="text-right">{formatPercent(channel.overallConversionRate)}</TableCell>
                  <TableCell className="text-right">
                    {channel.totalInvestment > 0 ? formatCurrency(channel.totalInvestment) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {generalCAC > 0 ? formatCurrency(generalCAC) : "-"}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(channel.avgLTV)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-medium">{formatRatio(generalLtvCac)}</span>
                      {getRatioBadge(generalLtvCac)}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No hay datos disponibles
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  }




  if (mode === 'traveler') {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Canal</TableHead>
              <TableHead className="text-right">Con Trip</TableHead>
              <TableHead className="text-right">Activos</TableHead>
              <TableHead className="text-right">Productivos</TableHead>
              <TableHead className="text-right">% Activación</TableHead>
              <TableHead className="text-right">Pkgs Entregados</TableHead>
              <TableHead className="text-right">Pkgs/Viajero</TableHead>
              <TableHead className="text-right">Inversión</TableHead>
              <TableHead className="text-right">CAC Viajero</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((channel) => {
              const productivityRate = channel.activeTravelers > 0
                ? (channel.productiveTravelers / channel.activeTravelers) * 100 : 0;
              const pkgsPerTraveler = channel.productiveTravelers > 0
                ? channel.packagesDelivered / channel.productiveTravelers : 0;

              return (
                <TableRow key={channel.channel}>
                  <TableCell className="font-medium">{channel.channelLabel}</TableCell>
                  <TableCell className="text-right">{channel.travelerUsers}</TableCell>
                  <TableCell className="text-right">{channel.activeTravelers}</TableCell>
                  <TableCell className="text-right">{channel.productiveTravelers}</TableCell>
                  <TableCell className="text-right">{formatPercent(productivityRate)}</TableCell>
                  <TableCell className="text-right">{channel.packagesDelivered}</TableCell>
                  <TableCell className="text-right">{pkgsPerTraveler.toFixed(1)}</TableCell>
                  <TableCell className="text-right">
                    {channel.travelerInvestment > 0 ? formatCurrency(channel.travelerInvestment) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {channel.travelerCAC > 0 ? formatCurrency(channel.travelerCAC) : "-"}
                  </TableCell>
                </TableRow>
              );
            })}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No hay datos disponibles
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Canal</TableHead>
            <TableHead className="text-right">Registrados</TableHead>
            <TableHead className="text-right">Activos</TableHead>
            <TableHead className="text-right">Monetizados</TableHead>
            <TableHead className="text-right">% Activación</TableHead>
            <TableHead className="text-right">% Monetización</TableHead>
            <TableHead className="text-right">Inversión</TableHead>
            <TableHead className="text-right">CAC</TableHead>
            <TableHead className="text-right">LTV</TableHead>
            <TableHead className="text-right">CAC/Pedido</TableHead>
            <TableHead className="text-center">LTV/CAC</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((channel) => (
            <TableRow key={channel.channel}>
              <TableCell className="font-medium">{channel.channelLabel}</TableCell>
              <TableCell className="text-right">{channel.totalUsers}</TableCell>
              <TableCell className="text-right">{channel.activeUsers}</TableCell>
              <TableCell className="text-right">{channel.monetizedUsers}</TableCell>
              <TableCell className="text-right">{formatPercent(channel.activationRate)}</TableCell>
              <TableCell className="text-right">{formatPercent(channel.monetizationRate)}</TableCell>
              <TableCell className="text-right">
                {channel.shopperInvestment > 0 ? formatCurrency(channel.shopperInvestment) : "-"}
              </TableCell>
              <TableCell className="text-right">
                {channel.shopperCAC > 0 ? formatCurrency(channel.shopperCAC) : "-"}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(channel.avgLTV)}</TableCell>
              <TableCell className="text-right">
                {channel.cacPerPaidOrder > 0 ? formatCurrency(channel.cacPerPaidOrder) : "-"}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-medium">{formatRatio(channel.ltvCacRatio)}</span>
                  {getRatioBadge(channel.ltvCacRatio)}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                No hay datos disponibles
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
