import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Package, ExternalLink, DollarSign, Hash, MapPin, Truck, Home, CalendarIcon } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type PackageType = Tables<"packages">;

interface Product {
  itemLink?: string;
  itemDescription?: string;
  estimatedPrice?: string | number;
  quantity?: string | number;
  requestType?: string;
  additionalNotes?: string;
  needsOriginalPackaging?: boolean;
}

interface DeliveryAddress {
  streetAddress?: string;
  cityArea?: string;
  hotelAirbnbName?: string;
  contactNumber?: string;
}

interface EditPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: PackageType;
  onSave: (updatedData: Partial<PackageType> & { id: string }) => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending_approval: "Pendiente de aprobación",
  approved: "Aprobado",
  pending_quote: "Pendiente de cotización",
  quote_sent: "Cotización enviada",
  quote_accepted: "Cotización aceptada",
  paid: "Pagado",
  in_transit: "En tránsito",
  received_by_traveler: "Recibido por viajero",
  pending_office_confirmation: "Pendiente confirmación oficina",
  delivered_to_office: "Entregado en oficina",
  completed: "Completado",
  cancelled: "Cancelado",
  rejected: "Rechazado",
};

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "completed") return "default";
  if (status === "cancelled" || status === "rejected") return "destructive";
  if (status.includes("pending")) return "secondary";
  return "outline";
};

export const EditPackageModal = ({ isOpen, onClose, pkg, onSave }: EditPackageModalProps) => {
  // Parse existing products data
  const existingProducts = Array.isArray(pkg.products_data) 
    ? (pkg.products_data as Product[]) 
    : [];

  // Parse existing data
  const existingAddress = pkg.confirmed_delivery_address as DeliveryAddress | null;

  // Local state for editable fields
  const [products, setProducts] = useState<Product[]>(existingProducts);
  const [itemDescription, setItemDescription] = useState(pkg.item_description || "");
  const [itemLink, setItemLink] = useState(pkg.item_link || "");
  const [additionalNotes, setAdditionalNotes] = useState(pkg.additional_notes || "");
  const [deliveryMethod, setDeliveryMethod] = useState(pkg.delivery_method || "pickup");
  const [packageDestination, setPackageDestination] = useState(pkg.package_destination || "");
  const [packageDestinationCountry, setPackageDestinationCountry] = useState(pkg.package_destination_country || "");
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>(existingAddress || {});

  // Destination options
  const destinationCountries = [
    { value: 'Guatemala', label: 'Guatemala' },
    { value: 'Estados Unidos', label: 'Estados Unidos' },
    { value: 'España', label: 'España' },
    { value: 'México', label: 'México' },
    { value: 'Otro', label: 'Otro país' }
  ];

  const citiesByCountry: Record<string, string[]> = {
    'Guatemala': ['Cualquier ciudad', 'Ciudad de Guatemala', 'Antigua Guatemala', 'Quetzaltenango', 'Escuintla', 'Otra ciudad'],
    'Estados Unidos': ['Cualquier ciudad', 'Miami', 'New York', 'Los Angeles', 'Houston', 'Chicago', 'Otra ciudad'],
    'España': ['Cualquier ciudad', 'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Otra ciudad'],
    'México': ['Cualquier ciudad', 'Ciudad de México', 'Guadalajara', 'Monterrey', 'Cancún', 'Otra ciudad'],
    'Otro': ['Cualquier ciudad', 'Otra ciudad']
  };
  const [deliveryDeadline, setDeliveryDeadline] = useState<Date | undefined>(
    pkg.delivery_deadline ? new Date(pkg.delivery_deadline) : undefined
  );
  const [isSaving, setIsSaving] = useState(false);

  // Determine what can be edited based on status
  const quoteAcceptedStatuses = ["quote_accepted", "paid", "in_transit", "received_by_traveler", "pending_office_confirmation", "delivered_to_office", "completed"];
  const canEditPrices = !quoteAcceptedStatuses.includes(pkg.status);
  const canEditDestination = !pkg.matched_trip_id; // Can't change destination if trip is assigned

  // Reset form when package changes
  useEffect(() => {
    const prods = Array.isArray(pkg.products_data) ? (pkg.products_data as Product[]) : [];
    const addr = pkg.confirmed_delivery_address as DeliveryAddress | null;
    setProducts(prods);
    setItemDescription(pkg.item_description || "");
    setItemLink(pkg.item_link || "");
    setAdditionalNotes(pkg.additional_notes || "");
    setDeliveryMethod(pkg.delivery_method || "pickup");
    setPackageDestination(pkg.package_destination || "");
    setPackageDestinationCountry(pkg.package_destination_country || "");
    setDeliveryAddress(addr || {});
    setDeliveryDeadline(pkg.delivery_deadline ? new Date(pkg.delivery_deadline) : undefined);
  }, [pkg]);

  const updateProduct = (index: number, field: keyof Product, value: string | number | boolean) => {
    setProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateDeliveryAddress = (field: keyof DeliveryAddress, value: string) => {
    setDeliveryAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData: Partial<PackageType> & { id: string } = {
        id: pkg.id,
        item_description: itemDescription,
        item_link: itemLink,
        additional_notes: additionalNotes,
        delivery_method: deliveryMethod,
        delivery_deadline: deliveryDeadline?.toISOString() || pkg.delivery_deadline,
        products_data: products as unknown as PackageType["products_data"],
      };

      // Only update destination if allowed
      if (canEditDestination) {
        updatedData.package_destination = packageDestination;
        updatedData.package_destination_country = packageDestinationCountry;
      }

      // Include delivery address if method is delivery
      if (deliveryMethod === "delivery") {
        updatedData.confirmed_delivery_address = deliveryAddress as unknown as PackageType["confirmed_delivery_address"];
      }

      await onSave(updatedData);
      onClose();
    } catch (error) {
      console.error("Error saving package:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const labelNumber = pkg.label_number ? `#${pkg.label_number}` : `#${pkg.id.slice(0, 6)}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Editar Pedido {labelNumber}
            </DialogTitle>
            <Badge variant={getStatusVariant(pkg.status)}>
              {STATUS_LABELS[pkg.status] || pkg.status}
            </Badge>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Modifica los detalles de tu pedido. Algunos campos pueden estar bloqueados según el estado.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-6">
            {/* Products Section */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Package className="h-4 w-4" />
                Productos ({products.length || 1})
              </Label>
              
              {products.length > 0 ? (
                <div className="space-y-4">
                  {products.map((product, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        Producto {index + 1}
                      </span>
                      
                      {/* Product Link */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Link del producto
                        </Label>
                        <Input
                          value={product.itemLink || ""}
                          onChange={(e) => updateProduct(index, "itemLink", e.target.value)}
                          placeholder="https://..."
                          className="text-sm"
                        />
                      </div>

                      {/* Product Description */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Descripción</Label>
                        <Input
                          value={product.itemDescription || ""}
                          onChange={(e) => updateProduct(index, "itemDescription", e.target.value)}
                          placeholder="Descripción del producto"
                          className="text-sm"
                        />
                      </div>

                      {/* Price and Quantity Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Precio estimado (USD)
                          </Label>
                          <Input
                            type="number"
                            value={product.estimatedPrice || ""}
                            onChange={(e) => updateProduct(index, "estimatedPrice", parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="text-sm"
                            disabled={!canEditPrices}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            Cantidad
                          </Label>
                          <Input
                            type="number"
                            value={product.quantity || 1}
                            onChange={(e) => updateProduct(index, "quantity", parseInt(e.target.value) || 1)}
                            min={1}
                            className="text-sm"
                            disabled={!canEditPrices}
                          />
                        </div>
                      </div>

                      {!canEditPrices && (
                        <p className="text-xs text-muted-foreground italic">
                          El precio y cantidad no se pueden modificar después de aceptar la cotización.
                        </p>
                      )}

                      {/* Empaque Original */}
                      <div className="flex items-center space-x-2 pt-2 border-t border-muted/40 mt-3">
                        <Checkbox
                          id={`packaging-${index}`}
                          checked={product.needsOriginalPackaging || false}
                          onCheckedChange={(checked) => 
                            updateProduct(index, "needsOriginalPackaging", checked === true)
                          }
                        />
                        <Label 
                          htmlFor={`packaging-${index}`} 
                          className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1"
                        >
                          📦 Conservar empaque/caja original
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback for packages without products_data - show general fields */
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Link del producto
                    </Label>
                    <Input
                      value={itemLink}
                      onChange={(e) => setItemLink(e.target.value)}
                      placeholder="https://..."
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Descripción</Label>
                    <Input
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      placeholder="Descripción del producto"
                      className="text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="border-t pt-4">
              <Label className="flex items-center gap-2 text-sm font-medium mb-4">
                <MapPin className="h-4 w-4" />
                Información de entrega
              </Label>

              {/* País de Destino */}
              <div className="space-y-2 mb-3">
                <Label className="text-xs text-muted-foreground">País de destino</Label>
                <Select 
                  value={packageDestinationCountry} 
                  onValueChange={(value) => {
                    setPackageDestinationCountry(value);
                    setPackageDestination(""); // Reset ciudad al cambiar país
                  }}
                  disabled={!canEditDestination}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el país" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationCountries.map(country => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ciudad de Destino */}
              <div className="space-y-2 mb-4">
                <Label className="text-xs text-muted-foreground">Ciudad de destino</Label>
                <Select 
                  value={packageDestination} 
                  onValueChange={setPackageDestination}
                  disabled={!canEditDestination || !packageDestinationCountry}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {(citiesByCountry[packageDestinationCountry] || []).map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!canEditDestination && (
                  <p className="text-xs text-muted-foreground italic">
                    El destino no se puede cambiar porque ya hay un viaje asignado.
                  </p>
                )}
              </div>

              {/* Delivery Deadline */}
              <div className="space-y-3 mb-4">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  Fecha límite de entrega
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deliveryDeadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deliveryDeadline 
                        ? format(deliveryDeadline, "PPP", { locale: es }) 
                        : "Selecciona una fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[60]" align="start">
                    <Calendar
                      mode="single"
                      selected={deliveryDeadline}
                      onSelect={setDeliveryDeadline}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Delivery Method */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  Método de entrega
                </Label>
                <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="font-normal cursor-pointer">
                      Recoger en oficina
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="font-normal cursor-pointer">
                      Entrega a domicilio
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Delivery Address - only show when delivery method is "delivery" */}
              {deliveryMethod === "delivery" && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-3">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    Dirección de entrega
                  </Label>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Dirección completa</Label>
                      <Input
                        value={deliveryAddress.streetAddress || ""}
                        onChange={(e) => updateDeliveryAddress("streetAddress", e.target.value)}
                        placeholder="Calle, número, zona, edificio..."
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Ciudad / Área</Label>
                      <Input
                        value={deliveryAddress.cityArea || ""}
                        onChange={(e) => updateDeliveryAddress("cityArea", e.target.value)}
                        placeholder="Ej: Guatemala, Zona 10"
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Referencia / Hotel / Airbnb</Label>
                      <Input
                        value={deliveryAddress.hotelAirbnbName || ""}
                        onChange={(e) => updateDeliveryAddress("hotelAirbnbName", e.target.value)}
                        placeholder="Cerca de..., nombre del hotel..."
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Teléfono de contacto</Label>
                      <Input
                        value={deliveryAddress.contactNumber || ""}
                        onChange={(e) => updateDeliveryAddress("contactNumber", e.target.value)}
                        placeholder="+502 1234 5678"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div className="border-t pt-4 space-y-3">
              <Label className="text-sm font-medium">Notas adicionales</Label>
              <Textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Instrucciones especiales, detalles adicionales..."
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPackageModal;
