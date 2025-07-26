import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, User } from "lucide-react";
import { toast } from 'sonner';

interface AvatarUploadPreviewProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

const AvatarUploadPreview = ({ onFileSelect, selectedFile }: AvatarUploadPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onFileSelect(file);
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onFileSelect(null);
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative">
        <Avatar className="h-20 w-20">
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt="Vista previa" />
          ) : (
            <AvatarFallback className="text-xl">
              <User className="h-6 w-6" />
            </AvatarFallback>
          )}
        </Avatar>
        
        {previewUrl && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0"
            onClick={handleRemoveFile}
            type="button"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex flex-col space-y-1">
        <Label htmlFor="avatar-upload" className="cursor-pointer">
          <Button
            variant="outline"
            size="sm"
            asChild
            type="button"
          >
            <span>
              <Upload className="h-4 w-4 mr-2" />
              {previewUrl ? 'Cambiar foto' : 'Subir foto'}
            </span>
          </Button>
        </Label>
        
        <Input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <p className="text-xs text-muted-foreground text-center">
          Opcional • Máximo 5MB
        </p>
      </div>
    </div>
  );
};

export default AvatarUploadPreview;