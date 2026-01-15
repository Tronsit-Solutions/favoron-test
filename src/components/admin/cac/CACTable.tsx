import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CACChannelData } from "@/hooks/useCACAnalytics";

interface CACTableProps {
  data: CACChannelData[];
}

const formatCurrency = (value: number) => `Q${value.toFixed(2)}`;
const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const formatRatio = (value: number) => {
  if (value === Infinity) return "∞";
  if (value === 0) return "-";
  return `${value.toFixed(2)}x`;
};

export const CACTable = ({ data }: CACTableProps) => {
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
                {channel.totalInvestment > 0 ? formatCurrency(channel.totalInvestment) : "-"}
              </TableCell>
              <TableCell className="text-right">
                {channel.cacPerMonetized > 0 ? formatCurrency(channel.cacPerMonetized) : "-"}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(channel.avgLTV)}</TableCell>
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
              <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                No hay datos disponibles
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
