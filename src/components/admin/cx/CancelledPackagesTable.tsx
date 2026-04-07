import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CancelledPackageRow } from "@/hooks/useCancelledPackages";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "destructive" | "secondary" | "outline" | "default" }> = {
  cancelled: { label: "Cancelado", variant: "destructive" },
  quote_expired: { label: "Cotización expirada", variant: "secondary" },
  quote_rejected: { label: "Cotización rechazada", variant: "outline" },
  deadline_expired: { label: "Fecha límite vencida", variant: "default" },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd MMM yyyy", { locale: es });
  } catch {
    return "—";
  }
}

function getProductName(row: CancelledPackageRow): string {
  if (row.products_data && Array.isArray(row.products_data) && row.products_data.length > 0) {
    const first = row.products_data[0];
    const name = first.name || first.description || first.title || row.item_description;
    return row.products_data.length > 1 ? `${name} (+${row.products_data.length - 1})` : name;
  }
  return row.item_description || "Sin descripción";
}

interface Props {
  rows: CancelledPackageRow[];
  loading: boolean;
}

export default function CancelledPackagesTable({ rows, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se encontraron paquetes cancelados o expirados.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shopper</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="min-w-[200px]">Razón</TableHead>
            <TableHead>Viajero</TableHead>
            <TableHead>Precio Est.</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead>Actualizado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const cfg = statusConfig[row.status] || { label: row.status, variant: "default" as const };
            return (
              <TableRow key={row.package_id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{row.user_name}</p>
                    {row.user_phone && (
                      <p className="text-xs text-muted-foreground">{row.user_phone}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm">
                  {getProductName(row)}
                </TableCell>
                <TableCell>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[250px]">
                  <span className="line-clamp-2">{row.computed_reason}</span>
                </TableCell>
                <TableCell className="text-sm">
                  {row.traveler_name || <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-sm">
                  {row.estimated_price != null ? `Q${row.estimated_price.toFixed(2)}` : "—"}
                </TableCell>
                <TableCell className="text-sm">{row.package_destination}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">{formatDate(row.created_at)}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">{formatDate(row.updated_at)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
