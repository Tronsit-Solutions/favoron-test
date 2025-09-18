import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Globe } from "lucide-react";

interface OfficeAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfficeAddressModal = ({ isOpen, onClose }: OfficeAddressModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Oficina de Favorón
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="font-medium">Dirección</p>
                <p className="text-sm text-muted-foreground">
                  Guatemala City, Guatemala<br />
                  Centro Comercial Fontabella<br />
                  Local 123, Zona 10
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Teléfono</p>
                <p className="text-sm text-muted-foreground">+502 2234-5678</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">info@favoron.app</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Sitio Web</p>
                <p className="text-sm text-muted-foreground">favoron.app</p>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Horarios de atención:</strong><br />
              Lunes a Viernes: 9:00 AM - 6:00 PM<br />
              Sábados: 9:00 AM - 1:00 PM
            </p>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};