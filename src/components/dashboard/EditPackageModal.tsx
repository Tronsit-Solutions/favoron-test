import { useState, useEffect, useMemo } from "react";
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
import { Package, ExternalLink, DollarSign, Hash, MapPin, Truck, Home, CalendarIcon, Lock, AlertCircle, RotateCcw, Plus, X } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

// Validation errors type
interface ValidationErrors {
  products: { [index: number]: { itemDescription?: string; itemLink?: string } };
  itemDescription?: string;
  packageDestination?: string;
  packageDestinationCountry?: string;
}

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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({ products: {} });

  // Destination options - use label-based values matching DB storage
  const destinationCountries = [
    { value: 'Guatemala', label: 'Guatemala' },
    { value: 'Estados Unidos', label: 'Estados Unidos' },
    { value: 'España', label: 'España' },
    { value: 'México', label: 'México' },
    { value: 'Otro', label: 'Otro país' },
  ];
  const citiesByCountry: Record<string, { value: string; label: string }[]> = {
    'Guatemala': [
      { value: 'Guatemala City', label: 'Ciudad de Guatemala' },
      { value: 'Antigua Guatemala', label: 'Antigua Guatemala' },
      { value: 'Quetzaltenango', label: 'Quetzaltenango' },
      { value: 'Escuintla', label: 'Escuintla' },
      { value: 'Mixco', label: 'Mixco' },
      { value: 'Villa Nueva', label: 'Villa Nueva' },
      { value: 'Cobán', label: 'Cobán' },
      { value: 'Huehuetenango', label: 'Huehuetenango' },
      { value: 'Otra ciudad', label: 'Otra ciudad' },
    ],
    'Estados Unidos': [
      { value: 'Miami', label: 'Miami' },
      { value: 'New York', label: 'New York' },
      { value: 'Los Angeles', label: 'Los Angeles' },
      { value: 'Houston', label: 'Houston' },
      { value: 'Otra ciudad', label: 'Otra ciudad' },
    ],
    'España': [
      { value: 'Madrid', label: 'Madrid' },
      { value: 'Barcelona', label: 'Barcelona' },
      { value: 'Valencia', label: 'Valencia' },
      { value: 'Sevilla', label: 'Sevilla' },
      { value: 'Otra ciudad', label: 'Otra ciudad' },
    ],
    'México': [
      { value: 'Ciudad de México', label: 'Ciudad de México' },
      { value: 'Guadalajara', label: 'Guadalajara' },
      { value: 'Monterrey', label: 'Monterrey' },
      { value: 'Cancún', label: 'Cancún' },
      { value: 'Otra ciudad', label: 'Otra ciudad' },
    ],
  };
  const cityOptions = citiesByCountry[packageDestinationCountry] || [];
  const hasCities = cityOptions.length > 0;
  const [deliveryDeadline, setDeliveryDeadline] = useState<Date | undefined>(
    pkg.delivery_deadline ? new Date(pkg.delivery_deadline) : undefined
  );
  const [isSaving, setIsSaving] = useState(false);

  // Determine what can be edited based on status
  const quoteAcceptedStatuses = ["quote_accepted", "paid", "in_transit", "received_by_traveler", "pending_office_confirmation", "delivered_to_office", "completed"];
  const canEditPrices = !quoteAcceptedStatuses.includes(pkg.status);
  const canEditDestination = !pkg.matched_trip_id; // Can't change destination if trip is assigned

  // Original values for change detection
  const originalValues = useMemo(() => ({
    products: existingProducts,
    itemDescription: pkg.item_description || "",
    itemLink: pkg.item_link || "",
    additionalNotes: pkg.additional_notes || "",
    deliveryMethod: pkg.delivery_method || "pickup",
    packageDestination: pkg.package_destination || "",
    packageDestinationCountry: pkg.package_destination_country || "",
    deliveryAddress: existingAddress || {},
    deliveryDeadline: pkg.delivery_deadline ? new Date(pkg.delivery_deadline) : undefined,
  }), [pkg]);

  // Detect changes
  const hasChanges = useMemo(() => {
    if (itemDescription !== originalValues.itemDescription) return true;
    if (itemLink !== originalValues.itemLink) return true;
    if (additionalNotes !== originalValues.additionalNotes) return true;
    if (deliveryMethod !== originalValues.deliveryMethod) return true;
    if (packageDestination !== originalValues.packageDestination) return true;
    if (packageDestinationCountry !== originalValues.packageDestinationCountry) return true;
    if (JSON.stringify(products) !== JSON.stringify(originalValues.products)) return true;
    if (JSON.stringify(deliveryAddress) !== JSON.stringify(originalValues.deliveryAddress)) return true;
    if (deliveryDeadline?.toISOString() !== originalValues.deliveryDeadline?.toISOString()) return true;
    return false;
  }, [products, itemDescription, itemLink, additionalNotes, deliveryMethod, packageDestination, packageDestinationCountry, deliveryAddress, deliveryDeadline, originalValues]);

  // Check if a specific field changed from original
  const fieldChanged = (field: string, currentValue: any): boolean => {
    const orig = (originalValues as any)[field];
    if (typeof currentValue === 'object') return JSON.stringify(currentValue) !== JSON.stringify(orig);
    return currentValue !== orig;
  };

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
    setValidationErrors({ products: {} });
  }, [pkg]);

  const updateProduct = (index: number, field: keyof Product, value: string | number | boolean) => {
    setProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    // Clear validation error for this field
    if (validationErrors.products[index]?.[field as keyof typeof validationErrors.products[0]]) {
      setValidationErrors(prev => ({
        ...prev,
        products: {
          ...prev.products,
          [index]: { ...prev.products[index], [field]: undefined }
        }
      }));
    }
  };

  const updateDeliveryAddress = (field: keyof DeliveryAddress, value: string) => {
    setDeliveryAddress(prev => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    const errors: ValidationErrors = { products: {} };
    let isValid = true;

    if (products.length > 0) {
      products.forEach((product, index) => {
        const productErrors: { itemDescription?: string; itemLink?: string } = {};
        if (!product.itemDescription?.trim()) {
          productErrors.itemDescription = "La descripción es obligatoria";
          isValid = false;
        }
        if (Object.keys(productErrors).length > 0) {
          errors.products[index] = productErrors;
        }
      });
    } else {
      if (!itemDescription.trim()) {
        errors.itemDescription = "La descripción es obligatoria";
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validate()) return;

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
      toast.success("Pedido actualizado correctamente");
      onClose();
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetChanges = () => {
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
    setValidationErrors({ products: {} });
  };

  const labelNumber = pkg.label_number ? `#${pkg.label_number}` : `#${pkg.id.slice(0, 6)}`;

  // Helper for changed field highlight
  const changedClass = (changed: boolean) => changed ? "ring-2 ring-amber-300/50 bg-amber-50/30" : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Editar Pedido {labelNumber}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs animate-fade-in">
                  Cambios sin guardar
                </Badge>
              )}
              <Badge variant={getStatusVariant(pkg.status)}>
                {STATUS_LABELS[pkg.status] || pkg.status}
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Modifica los detalles de tu pedido. Los campos con <Lock className="h-3 w-3 inline" /> están bloqueados.
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
                  {products.map((product, index) => {
                    const origProduct = originalValues.products[index];
                    const descChanged = origProduct && product.itemDescription !== origProduct.itemDescription;
                    const linkChanged = origProduct && product.itemLink !== origProduct.itemLink;
                    const priceChanged = origProduct && String(product.estimatedPrice) !== String(origProduct.estimatedPrice);
                    const qtyChanged = origProduct && String(product.quantity) !== String(origProduct.quantity);
                    const packagingChanged = origProduct && product.needsOriginalPackaging !== origProduct.needsOriginalPackaging;

                    return (
                    <div key={index} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Producto {index + 1}
                      </span>
                      {products.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => setProducts(prev => prev.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                      
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
                          className={cn("text-sm", changedClass(!!linkChanged))}
                        />
                      </div>

                      {/* Product Description */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Descripción <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={product.itemDescription || ""}
                          onChange={(e) => updateProduct(index, "itemDescription", e.target.value)}
                          placeholder="Descripción del producto"
                          className={cn(
                            "text-sm",
                            changedClass(!!descChanged),
                            validationErrors.products[index]?.itemDescription && "border-destructive ring-destructive/30"
                          )}
                        />
                        {validationErrors.products[index]?.itemDescription && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {validationErrors.products[index].itemDescription}
                          </p>
                        )}
                      </div>

                      {/* Price and Quantity Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            {!canEditPrices && <Lock className="h-3 w-3" />}
                            <DollarSign className="h-3 w-3" />
                            Precio estimado (USD)
                          </Label>
                          <Input
                            type="number"
                            value={product.estimatedPrice || ""}
                            onChange={(e) => updateProduct(index, "estimatedPrice", parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className={cn("text-sm", changedClass(!!priceChanged))}
                            disabled={!canEditPrices}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            {!canEditPrices && <Lock className="h-3 w-3" />}
                            <Hash className="h-3 w-3" />
                            Cantidad
                          </Label>
                          <Input
                            type="number"
                            value={product.quantity || 1}
                            onChange={(e) => updateProduct(index, "quantity", parseInt(e.target.value) || 1)}
                            min={1}
                            className={cn("text-sm", changedClass(!!qtyChanged))}
                            disabled={!canEditPrices}
                          />
                        </div>
                      </div>

                      {!canEditPrices && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                          <Lock className="h-3 w-3 flex-shrink-0" />
                          Precio y cantidad bloqueados después de aceptar cotización
                        </div>
                      )}

                      {/* Empaque Original */}
                      <div className={cn(
                        "flex items-center space-x-2 pt-2 border-t border-muted/40 mt-3",
                        changedClass(!!packagingChanged)
                      )}>
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
                    );
                   })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 text-xs"
                    onClick={() => setProducts(prev => [...prev, {
                      itemLink: '',
                      itemDescription: '',
                      estimatedPrice: '',
                      quantity: 1,
                      requestType: 'compra',
                      additionalNotes: '',
                      needsOriginalPackaging: false,
                    }])}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar producto
                  </Button>
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
                      className={cn("text-sm", changedClass(fieldChanged("itemLink", itemLink)))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Descripción <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={itemDescription}
                      onChange={(e) => {
                        setItemDescription(e.target.value);
                        if (validationErrors.itemDescription) {
                          setValidationErrors(prev => ({ ...prev, itemDescription: undefined }));
                        }
                      }}
                      placeholder="Descripción del producto"
                      className={cn(
                        "text-sm",
                        changedClass(fieldChanged("itemDescription", itemDescription)),
                        validationErrors.itemDescription && "border-destructive ring-destructive/30"
                      )}
                    />
                    {validationErrors.itemDescription && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.itemDescription}
                      </p>
                    )}
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
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  {!canEditDestination && <Lock className="h-3 w-3" />}
                  País de destino
                </Label>
                <Select 
                  value={packageDestinationCountry} 
                  onValueChange={(value) => {
                    setPackageDestinationCountry(value);
                    setPackageDestination(""); // Reset ciudad al cambiar país
                  }}
                  disabled={!canEditDestination}
                >
                  <SelectTrigger className={cn(changedClass(fieldChanged("packageDestinationCountry", packageDestinationCountry)))}>
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
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  {!canEditDestination && <Lock className="h-3 w-3" />}
                  Ciudad de destino
                </Label>
                {hasCities ? (
                  <Select 
                    value={packageDestination} 
                    onValueChange={setPackageDestination}
                    disabled={!canEditDestination || !packageDestinationCountry}
                  >
                    <SelectTrigger className={cn(changedClass(fieldChanged("packageDestination", packageDestination)))}>
                      <SelectValue placeholder="Selecciona la ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      {cityOptions.map(city => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={packageDestination}
                    onChange={(e) => setPackageDestination(e.target.value)}
                    placeholder="Escribe la ciudad de destino"
                    disabled={!canEditDestination || !packageDestinationCountry}
                    className={cn("text-sm", changedClass(fieldChanged("packageDestination", packageDestination)))}
                  />
                )}
                {!canEditDestination && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                    <Lock className="h-3 w-3 flex-shrink-0" />
                    El destino no se puede cambiar porque ya hay un viaje asignado
                  </div>
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
                        !deliveryDeadline && "text-muted-foreground",
                        changedClass(deliveryDeadline?.toISOString() !== originalValues.deliveryDeadline?.toISOString())
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
              <div className={cn("space-y-3", changedClass(fieldChanged("deliveryMethod", deliveryMethod)))}>
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
                className={cn(changedClass(fieldChanged("additionalNotes", additionalNotes)))}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t">
          <div className="flex w-full items-center justify-between">
            <div>
              {hasChanges && (
                <Button variant="ghost" size="sm" onClick={handleResetChanges} disabled={isSaving} className="text-xs text-muted-foreground">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Deshacer
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPackageModal;
