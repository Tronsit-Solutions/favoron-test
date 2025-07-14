import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PackageReceiptConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (photoUrl?: string) => void;
  packageName: string;
  packageId: string;
}

const PackageReceiptConfirmation = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  packageName,
  packageId
}: PackageReceiptConfirmationProps) => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Formato no válido",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "La imagen debe ser menor a 5MB",
          variant: "destructive",
        });
        return;
      }

      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    let photoUrl: string | undefined;

    try {
      // Upload photo if selected
      if (photoFile) {
        const fileExtension = photoFile.name.split('.').pop();
        const fileName = `confirmation_${Date.now()}.${fileExtension}`;
        const filePath = `${user.id}/${packageId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('traveler-confirmations')
          .upload(filePath, photoFile);

        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
          toast({
            title: "Error al subir imagen",
            description: "No se pudo subir la imagen. Intenta de nuevo.",
            variant: "destructive",
          });
          setUploading(false);
          return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('traveler-confirmations')
          .getPublicUrl(filePath);

        photoUrl = urlData.publicUrl;
      }

      // Call onConfirm with the photo URL
      onConfirm(photoUrl);
      
      // Reset form
      setPhotoFile(null);
      setPhotoPreview("");
      onClose();
      
    } catch (error) {
      console.error('Error confirming receipt:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al confirmar la recepción",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setPhotoFile(null);
      setPhotoPreview("");
      onClose();
    }
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
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Puedes subir una foto del paquete recibido (máximo 5MB)
              </p>
            </div>
          </div>

          {photoPreview && (
            <div className="border rounded-lg p-2">
              <img 
                src={photoPreview} 
                alt="Vista previa" 
                className="w-full h-32 object-cover rounded"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={uploading} className="flex items-center space-x-2">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  <span>Confirmar recepción</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackageReceiptConfirmation;