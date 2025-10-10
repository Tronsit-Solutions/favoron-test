import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProductPhoto {
  filename: string;
  filePath: string;
  bucket: string;
  uploadedAt: string;
  previewUrl?: string;
}

interface ProductPhotoUploadProps {
  photos: ProductPhoto[];
  onPhotosChange: (photos: ProductPhoto[]) => void;
  maxPhotos?: number;
  required?: boolean;
}

const ProductPhotoUpload = ({ 
  photos = [],
  onPhotosChange,
  maxPhotos = 5,
  required = true
}: ProductPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check if we can add more photos
    const remainingSlots = maxPhotos - photos.length;
    if (files.length > remainingSlots) {
      toast({
        title: "Demasiadas fotos",
        description: `Solo puedes subir ${remainingSlots} foto(s) más (máximo ${maxPhotos} total)`,
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    // Validate all files first
    for (const file of files) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Formato no válido",
          description: "Solo se permiten archivos JPG, PNG o WebP",
          variant: "destructive",
        });
        event.target.value = '';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: `${file.name} debe ser menor a 5MB`,
          variant: "destructive",
        });
        event.target.value = '';
        return;
      }
    }

    setUploading(true);

    try {
      const uploadedPhotos: ProductPhoto[] = [];

      for (const file of files) {
        const fileExtension = file.name.split('.').pop();
        const fileName = `product_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const filePath = `${user?.id}/${fileName}`;
        const bucketName = 'product-photos';

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file);

        if (uploadError) {
          console.error('❌ Storage upload error:', uploadError);
          throw new Error(`Error al subir ${file.name}`);
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);

        uploadedPhotos.push({
          filename: file.name,
          filePath,
          bucket: bucketName,
          uploadedAt: new Date().toISOString(),
          previewUrl,
        });
      }

      // Update parent with all photos
      onPhotosChange([...photos, ...uploadedPhotos]);

      toast({
        title: "Fotos subidas exitosamente",
        description: `${uploadedPhotos.length} foto(s) agregada(s)`,
      });

    } catch (error: any) {
      console.error('❌ Error uploading photos:', error);
      toast({
        title: "Error al subir fotos",
        description: error.message || "Intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
    
    toast({
      title: "Foto eliminada",
      description: "La foto ha sido removida",
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
      />

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative group aspect-square rounded-md overflow-hidden border border-border">
              <img 
                src={photo.previewUrl} 
                alt={`Producto ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemovePhoto(index)}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Eliminar
                </Button>
              </div>
              <div className="absolute top-2 right-2 bg-background/90 px-2 py-1 rounded-md text-xs font-medium">
                {index + 1}/{maxPhotos}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {canAddMore && (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-4">
          <div className="text-center">
            <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-3">
              {photos.length === 0 
                ? `Sube fotos del producto (${required ? 'obligatorio, ' : ''}máximo ${maxPhotos})`
                : `Puedes agregar ${maxPhotos - photos.length} foto(s) más`
              }
            </p>
            <Button 
              type="button"
              onClick={handleUploadClick}
              size="sm"
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-3 w-3 mr-2" />
                  {photos.length === 0 ? 'Subir Fotos' : 'Agregar Más Fotos'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        JPG, PNG, WebP. Máximo 5MB por foto. {photos.length}/{maxPhotos} foto(s) subida(s).
      </p>
    </div>
  );
};

export default ProductPhotoUpload;
