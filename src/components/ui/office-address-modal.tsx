import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Globe } from "lucide-react";
import { useFavoronCompanyInfo } from "@/hooks/useFavoronCompanyInfo";
import { Skeleton } from "@/components/ui/skeleton";

interface OfficeAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfficeAddressModal = ({ isOpen, onClose }: OfficeAddressModalProps) => {
  const { companyInfo, loading } = useFavoronCompanyInfo();

  const formatAddress = () => {
    if (!companyInfo) return "Información no disponible";
    
    const parts = [];
    if (companyInfo.address_line_1) parts.push(companyInfo.address_line_1);
    if (companyInfo.address_line_2) parts.push(companyInfo.address_line_2);
    if (companyInfo.city) parts.push(companyInfo.city);
    if (companyInfo.state_department && companyInfo.state_department !== companyInfo.city) {
      parts.push(companyInfo.state_department);
    }
    if (companyInfo.country) parts.push(companyInfo.country);
    if (companyInfo.postal_code) parts.push(`CP: ${companyInfo.postal_code}`);
    
    return parts.length > 0 ? parts.join(', ') : "Dirección no disponible";
  };
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
          {loading ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">Dirección</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {formatAddress()}
                  </p>
                </div>
              </div>
              
              {companyInfo?.phone_number && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">{companyInfo.phone_number}</p>
                  </div>
                </div>
              )}
              
              {companyInfo?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{companyInfo.email}</p>
                  </div>
                </div>
              )}
              
              {companyInfo?.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Sitio Web</p>
                    <p className="text-sm text-muted-foreground">{companyInfo.website}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
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