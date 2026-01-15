import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface MonthlyCAC {
  month: string;
  newUsers: number;
  activeUsers: number;
  monetizedUsers: number;
  investment: number;
  revenue: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
}

interface CACMonthlyTableProps {
  data: MonthlyCAC[];
}

const formatCurrency = (value: number): string => {
  if (value === 0) return "-";
  return `Q${value.toFixed(2)}`;
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

const formatMonth = (monthStr: string): string => {
  const [year, monthNum] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return format(date, "MMM yyyy", { locale: es });
};

const getRatioBadge = (ratio: number) => {
  if (ratio === 0 || !isFinite(ratio)) {
    return <Badge variant="outline" className="text-xs">Sin datos</Badge>;
  }
  if (ratio >= 3) {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs gap-1">
        <TrendingUp className="h-3 w-3" />
        {ratio.toFixed(2)}x
      </Badge>
    );
  }
  if (ratio >= 1) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs gap-1">
        <Minus className="h-3 w-3" />
        {ratio.toFixed(2)}x
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs gap-1">
      <TrendingDown className="h-3 w-3" />
      {ratio.toFixed(2)}x
    </Badge>
  );
};

export const CACMonthlyTable = ({ data }: CACMonthlyTableProps) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay datos mensuales disponibles</p>
        <p className="text-sm mt-1">Registra inversiones y espera usuarios nuevos</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">Mes</th>
            <th className="text-right p-3 font-medium">Nuevos</th>
            <th className="text-right p-3 font-medium">Activos</th>
            <th className="text-right p-3 font-medium">Monetizados</th>
            <th className="text-right p-3 font-medium">Tasa Conv.</th>
            <th className="text-right p-3 font-medium">Inversión</th>
            <th className="text-right p-3 font-medium">CAC</th>
            <th className="text-right p-3 font-medium">LTV</th>
            <th className="text-center p-3 font-medium">LTV/CAC</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const conversionRate = row.newUsers > 0 
              ? (row.monetizedUsers / row.newUsers) * 100 
              : 0;
            
            return (
              <tr key={row.month} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3 font-medium capitalize">{formatMonth(row.month)}</td>
                <td className="p-3 text-right">{row.newUsers}</td>
                <td className="p-3 text-right">{row.activeUsers}</td>
                <td className="p-3 text-right">{row.monetizedUsers}</td>
                <td className="p-3 text-right text-muted-foreground">
                  {formatPercent(conversionRate)}
                </td>
                <td className="p-3 text-right">{formatCurrency(row.investment)}</td>
                <td className="p-3 text-right font-medium">
                  {row.cac > 0 ? formatCurrency(row.cac) : "-"}
                </td>
                <td className="p-3 text-right">
                  {row.ltv > 0 ? formatCurrency(row.ltv) : "-"}
                </td>
                <td className="p-3 text-center">
                  {getRatioBadge(row.ltvCacRatio)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
