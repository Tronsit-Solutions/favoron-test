import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Package, Calendar, MapPin, Tag, Truck, User, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import PackageProductDisplay from "@/components/dashboard/PackageProductDisplay";
import { CXPackageRow } from "@/hooks/useCustomerExperience";

interface Props {
  row: CXPackageRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userType: "shopper" | "traveler";
}

const deliveryMethodLabels: Record<string, string> = {
  pickup: "Recoger en oficina",
  delivery: "Entrega a domicilio",
  messenger: "Mensajero",
};

export default function CXPackageDetailModal({ row, open, onOpenChange, userType }: Props) {
  if (!row) return null;

  const products = Array.isArray(row.products_data) ? row.products_data : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalles del Pedido
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Label & destination */}
          <div className="flex items-center gap-3 flex-wrap">
            {row.label_number && (
              <Badge variant="outline" className="gap-1">
                <Tag className="h-3 w-3" />
                #{row.label_number}
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" />
              {row.package_destination}
            </Badge>
            {row.delivery_method && (
              <Badge variant="secondary" className="gap-1">
                <Truck className="h-3 w-3" />
                {deliveryMethodLabels[row.delivery_method] || row.delivery_method}
              </Badge>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <div>
                <p className="text-xs text-muted-foreground">Creado</p>
                <p className="text-foreground">{format(new Date(row.created_at), "dd MMM yyyy", { locale: es })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <div>
                <p className="text-xs text-muted-foreground">Completado</p>
                <p className="text-foreground">{format(new Date(row.completed_at), "dd MMM yyyy", { locale: es })}</p>
              </div>
            </div>
          </div>

          {/* Counterpart */}
          {row.counterpart_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{userType === "shopper" ? "Viajero:" : "Shopper:"}</span>
              <span className="font-medium">{row.counterpart_name}</span>
            </div>
          )}

          {/* Price */}
          {row.estimated_price && (
            <div className="text-sm">
              <span className="text-muted-foreground">Precio estimado: </span>
              <span className="font-semibold">Q{row.estimated_price.toFixed(2)}</span>
            </div>
          )}

          <Separator />

          {/* Products */}
          <div>
            <h4 className="text-sm font-medium mb-2">Productos</h4>
            <PackageProductDisplay
              products={products}
              itemDescription={row.item_description}
              estimatedPrice={row.estimated_price?.toString()}
            />
          </div>

          {/* Additional notes */}
          {row.additional_notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Notas adicionales
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{row.additional_notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
