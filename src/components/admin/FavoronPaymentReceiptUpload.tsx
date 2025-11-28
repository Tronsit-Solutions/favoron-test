import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FavoronPaymentReceiptUploadProps {
  paymentOrderId: string;
  onUploadComplete: () => void;
}

const FavoronPaymentReceiptUpload = ({ paymentOrderId, onUploadComplete }: FavoronPaymentReceiptUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo no debe superar 5MB");
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error("Formato no válido. Solo se permiten imágenes (JPG, PNG, GIF, WebP) y PDF");
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Por favor selecciona un archivo");
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `favoron-payment-${paymentOrderId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, selectedFile);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast.error("Error al subir el archivo");
        return;
      }

      // Update payment order with receipt info
      const { error: updateError } = await supabase
        .from('payment_orders')
        .update({
          receipt_url: fileName,
          receipt_filename: selectedFile.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentOrderId);

      if (updateError) {
        console.error('Error updating payment order:', updateError);
        toast.error("Error al actualizar la orden de pago");
        return;
      }

      toast.success("Comprobante subido exitosamente");
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast.error("Error al subir el comprobante");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="favoron-receipt" className="text-sm font-medium">
          Subir Comprobante de Pago de Favorón
        </Label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              id="favoron-receipt"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="cursor-pointer"
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            size="sm"
          >
            {uploading ? (
              <>Subiendo...</>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir
              </>
            )}
          </Button>
        </div>
        {selectedFile && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>{selectedFile.name}</span>
          </div>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        PDF, JPG, PNG, GIF, WebP. Máximo 5MB.
      </p>
    </div>
  );
};

export default FavoronPaymentReceiptUpload;
