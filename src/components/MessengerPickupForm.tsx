import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Home, Building2, Clock } from "lucide-react";

interface MessengerPickupFormProps {
  onSubmit: (pickupData: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const MessengerPickupForm = ({ onSubmit, onCancel, initialData }: MessengerPickupFormProps) => {
  const [formData, setFormData] = useState({
    streetAddress: initialData?.streetAddress || '',
    cityArea: initialData?.cityArea || '',
    accommodationName: initialData?.accommodationName || '',
    contactNumber: initialData?.contactNumber || '',
    pickupInstructions: initialData?.pickupInstructions || '',
    preferredTime: initialData?.preferredTime || ''
  });

  const handleSubmit = () => {
    if (!formData.streetAddress || !formData.cityArea || !formData.contactNumber) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <MapPin className="h-5 w-5 text-yellow-600" />
        <h3 className="font-medium text-yellow-800">Información para recolección por mensajero</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="streetAddress" className="text-sm font-medium">
            Dirección completa *
          </Label>
          <div className="relative">
            <Home className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="streetAddress"
              placeholder="Ej: 5ta Avenida 14-44, Zona 10"
              value={formData.streetAddress}
              onChange={(e) => handleInputChange('streetAddress', e.target.value)}
              className="pl-10"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Dirección donde el mensajero debe recoger los paquetes
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cityArea" className="text-sm font-medium">
            Ciudad/Zona *
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="cityArea"
              placeholder="Ej: Guatemala, Zona 10"
              value={formData.cityArea}
              onChange={(e) => handleInputChange('cityArea', e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accommodationName" className="text-sm font-medium">
            Nombre del lugar, condominio, edificio, etc (opcional)
          </Label>
          <Input
            id="accommodationName"
            placeholder="Ej: Hotel Real InterContinental, Edificio Europlaza"
            value={formData.accommodationName}
            onChange={(e) => handleInputChange('accommodationName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactNumber" className="text-sm font-medium">
            Número de contacto *
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="contactNumber"
              type="tel"
              placeholder="Ej: +502 1234-5678"
              value={formData.contactNumber}
              onChange={(e) => handleInputChange('contactNumber', e.target.value)}
              className="pl-10"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Número donde el mensajero puede contactarte
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredTime" className="text-sm font-medium">
            Horario preferido para recolección (opcional)
          </Label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="preferredTime"
              placeholder="Ej: 9:00 AM - 5:00 PM"
              value={formData.preferredTime}
              onChange={(e) => handleInputChange('preferredTime', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pickupInstructions" className="text-sm font-medium">
            Instrucciones adicionales (opcional)
          </Label>
          <Textarea
            id="pickupInstructions"
            placeholder="Ej: Preguntar en recepción por mi nombre, usar entrada principal, llamar antes de llegar..."
            value={formData.pickupInstructions}
            onChange={(e) => handleInputChange('pickupInstructions', e.target.value)}
            className="min-h-[60px] resize-y"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Instrucciones especiales para el mensajero
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded p-3">
          <p className="text-sm text-amber-800">
            🚚 <strong>Importante:</strong> El mensajero se coordinará contigo el día de la recolección. 
            El costo del servicio (Q25-Q40) será descontado de tus ganancias como viajero.
          </p>
        </div>

        <div className="flex space-x-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button type="button" variant="secondary" className="flex-1" onClick={handleSubmit}>
            Confirmar Información
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessengerPickupForm;