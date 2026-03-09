import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package as PackageIcon, Calendar, Camera } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ProductData } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductConfirmationItemProps {
  product: ProductData;
  index: number;
  packageId: string;
  onConfirm: (productIndex: number, photo: string) => Promise<void>;
  isConfirming?: boolean;
}

export const ProductConfirmationItem = ({ 
  product, 
  index, 
  packageId,
  onConfirm,
  isConfirming = false 
}: ProductConfirmationItemProps) => {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const isConfirmed = product.receivedByTraveler;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "La imagen debe ser menor a 5MB",
          variant: "destructive"
        });
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmClick = () => {
    setShowPhotoModal(true);
  };

  const uploadPhotoToStorage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${packageId}/${index}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('product-receipts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }
      
      // Return storage path (bucket/filePath) for signed URL resolution
      return `product-receipts/${data.path}`;
    } catch (error) {
      console.error('Error uploading photo to storage:', error);
      return null;
    }
  };

  const handleConfirmWithPhoto = async () => {
    setIsUploading(true);
    try {
      let photoUrl = '';
      
      if (photoFile) {
        // Upload to Supabase Storage instead of base64
        const uploadedUrl = await uploadPhotoToStorage(photoFile);
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        } else {
          toast({
            title: "Error al subir foto",
            description: "No se pudo subir la foto, pero puedes continuar sin ella.",
            variant: "destructive"
          });
        }
      }
      
      await onConfirm(index, photoUrl);
      setShowPhotoModal(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error('Error confirming product:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Card className={`p-4 ${isConfirmed ? 'bg-green-50/50 border-green-200' : 'bg-card'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-3">
              <PackageIcon className={`h-5 w-5 mt-0.5 ${isConfirmed ? 'text-green-600' : 'text-muted-foreground'}`} />
              <div className="flex-1">
                <p className="font-medium text-sm">{product.itemDescription}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>Cantidad: {product.quantity}</span>
                  <span>•</span>
                  <span>${parseFloat(product.estimatedPrice || '0').toFixed(2)}</span>
                </div>
              </div>
            </div>

            {isConfirmed && product.receivedAt && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100/50 rounded-md px-2 py-1.5 ml-8">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Confirmado el {format(new Date(product.receivedAt), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {isConfirmed ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Confirmado
              </Badge>
            ) : (
              <>
                <Badge variant="secondary" className="text-xs">
                  Pendiente
                </Badge>
                <Button
                  size="sm"
                  onClick={handleConfirmClick}
                  disabled={isConfirming}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Camera className="h-3.5 w-3.5 mr-1.5" />
                  Confirmar
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Photo upload modal */}
      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar producto recibido</DialogTitle>
            <DialogDescription>
              Opcionalmente sube una foto del producto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-photo">Foto del producto (opcional)</Label>
              <Input
                id="product-photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="cursor-pointer"
              />
            </div>

            {photoPreview && (
              <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">{product.itemDescription}</p>
              <p className="text-xs text-muted-foreground">
                Cantidad: {product.quantity} • ${parseFloat(product.estimatedPrice || '0').toFixed(2)}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPhotoModal(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmWithPhoto}
              disabled={isUploading}
            >
              {isUploading ? "Confirmando..." : "Confirmar recepción"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
