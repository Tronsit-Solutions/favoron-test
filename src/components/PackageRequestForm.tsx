
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Package, Link2, DollarSign, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PackageRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (packageData: any) => void;
}

const PackageRequestForm = ({ isOpen, onClose, onSubmit }: PackageRequestFormProps) => {
  const [formData, setFormData] = useState({
    itemLink: '',
    itemDescription: '',
    estimatedPrice: '',
    deliveryDeadline: null as Date | null,
    additionalNotes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemLink || !formData.itemDescription || !formData.estimatedPrice || !formData.deliveryDeadline) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    onSubmit(formData);
    setFormData({
      itemLink: '',
      itemDescription: '',
      estimatedPrice: '',
      deliveryDeadline: null,
      additionalNotes: ''
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-primary" />
            <span>Nueva Solicitud de Paquete</span>
          </DialogTitle>
          <DialogDescription>
            Completa la información del producto que necesitas. Nuestro equipo revisará tu solicitud.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="itemLink">Link del producto *</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="itemLink"
                type="url"
                placeholder="https://amazon.com/producto..."
                value={formData.itemLink}
                onChange={(e) => handleInputChange('itemLink', e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Copia el link del producto desde Amazon, eBay, u otra tienda online
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemDescription">Descripción del producto *</Label>
            <Textarea
              id="itemDescription"
              placeholder="Ejemplo: iPhone 15 Pro Max 256GB Color Azul Titanio"
              value={formData.itemDescription}
              onChange={(e) => handleInputChange('itemDescription', e.target.value)}
              className="min-h-[80px]"
              required
            />
            <p className="text-xs text-muted-foreground">
              Describe detalladamente el producto (marca, modelo, color, talla, etc.)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedPrice">Precio estimado (USD) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="estimatedPrice"
                type="number"
                step="0.01"
                placeholder="299.99"
                value={formData.estimatedPrice}
                onChange={(e) => handleInputChange('estimatedPrice', e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Precio aproximado del producto sin incluir envío
            </p>
          </div>

          <div className="space-y-2">
            <Label>Fecha límite de entrega *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.deliveryDeadline ? (
                    format(formData.deliveryDeadline, "PPP", { locale: es })
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.deliveryDeadline || undefined}
                  onSelect={(date) => handleInputChange('deliveryDeadline', date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              ¿Para cuándo necesitas el producto?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Notas adicionales</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Información adicional, instrucciones especiales, preferencias de entrega, etc."
              value={formData.additionalNotes}
              onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">¿Cómo funciona?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Revisaremos tu solicitud en 24-48 horas</li>
                  <li>• Te conectaremos con viajeros disponibles</li>
                  <li>• Recibirás cotizaciones y podrás elegir</li>
                  <li>• Solo pagas cuando aceptes una cotización</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Enviar Solicitud
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PackageRequestForm;
