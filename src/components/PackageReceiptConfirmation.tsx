import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload } from "lucide-react";

interface PackageReceiptConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (photo?: string) => void;
  packageName: string;
}

const PackageReceiptConfirmation = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  packageName 
}: PackageReceiptConfirmationProps) => {
  const [photo, setPhoto] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    onConfirm(photo);
    setPhoto("");
    onClose();
  };

  const handleClose = () => {
    setPhoto("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar recepción del paquete</DialogTitle>
          <DialogDescription>
            Confirma que recibiste: <strong>{packageName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="photo" className="text-sm font-medium">
              Foto del paquete (opcional)
            </Label>
            <div className="mt-2">
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Puedes subir una foto del paquete recibido
              </p>
            </div>
          </div>

          {photo && (
            <div className="border rounded-lg p-2">
              <img 
                src={photo} 
                alt="Vista previa" 
                className="w-full h-32 object-cover rounded"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="flex items-center space-x-2">
              <Camera className="h-4 w-4" />
              <span>Confirmar recepción</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackageReceiptConfirmation;