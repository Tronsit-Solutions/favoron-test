import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Package, Calendar, MapPin, User, AlertCircle, Globe } from "lucide-react";
import PackageProductDisplay from "@/components/dashboard/PackageProductDisplay";
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
  const [selectedRow, setSelectedRow] = useState<CancelledPackageRow | null>(null);

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

  const products = selectedRow && Array.isArray(selectedRow.products_data) ? selectedRow.products_data : undefined;
  const selectedCfg = selectedRow ? (statusConfig[selectedRow.status] || { label: selectedRow.status, variant: "default" as const }) : null;

  return (
    <>
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
                <TableRow
                  key={row.package_id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedRow(row)}
                >
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

      {/* Detail Modal */}
      <Dialog open={!!selectedRow} onOpenChange={(open) => { if (!open) setSelectedRow(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalles del Pedido Cancelado
            </DialogTitle>
          </DialogHeader>

          {selectedRow && (
            <div className="space-y-4">
              {/* Status & Destination */}
              <div className="flex items-center gap-3 flex-wrap">
                {selectedCfg && (
                  <Badge variant={selectedCfg.variant}>{selectedCfg.label}</Badge>
                )}
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedRow.package_destination}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Globe className="h-3 w-3" />
                  {selectedRow.purchase_origin}
                </Badge>
              </div>

              {/* Shopper */}
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">{selectedRow.user_name}</span>
                  {selectedRow.user_phone && (
                    <span className="text-muted-foreground ml-2">• {selectedRow.user_phone}</span>
                  )}
                </div>
              </div>

              {/* Traveler */}
              {selectedRow.traveler_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Viajero:</span>
                  <span className="font-medium">{selectedRow.traveler_name}</span>
                </div>
              )}

              {/* Price */}
              {selectedRow.estimated_price != null && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Precio estimado: </span>
                  <span className="font-semibold">Q{selectedRow.estimated_price.toFixed(2)}</span>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Creado</p>
                    <p className="text-foreground">{formatDate(selectedRow.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="text-foreground">{formatDate(selectedRow.delivery_deadline)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Actualizado</p>
                    <p className="text-foreground">{formatDate(selectedRow.updated_at)}</p>
                  </div>
                </div>
              </div>

              {/* Cancellation Reason */}
              {selectedRow.computed_reason && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Razón de cancelación
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedRow.computed_reason}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Products */}
              <div>
                <h4 className="text-sm font-medium mb-2">Productos</h4>
                <PackageProductDisplay
                  products={products}
                  itemDescription={selectedRow.item_description}
                  estimatedPrice={selectedRow.estimated_price?.toString()}
                />
                {!products && (
                  <p className="text-sm text-muted-foreground">{selectedRow.item_description || "Sin descripción"}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}