import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Receipt, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Package } from "@/types";

interface PaymentReceiptUploadProps {
  pkg: Package;
  onUpload: (data: any) => void;
}

const PaymentReceiptUpload = ({ pkg, onUpload }: PaymentReceiptUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten archivos JPG, PNG, GIF, WebP o PDF",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `payment_receipt_${pkg.id}_${Date.now()}.${fileExtension}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast({
          title: "Error al subir archivo",
          description: "No se pudo subir el archivo. Intenta de nuevo.",
          variant: "destructive",
        });
        return;
      }

      const receiptData = {
        type: 'payment_receipt',
        filePath,
        filename: file.name,
        uploadedAt: new Date().toISOString()
      };

      // Update package with payment receipt and change status to approved
      const { error: updateError } = await supabase
        .from('packages')
        .update({
          payment_receipt: receiptData,
          status: 'approved'
        })
        .eq('id', pkg.id);

      if (updateError) {
        console.error('Error updating package:', updateError);
        toast({
          title: "Error al actualizar paquete",
          description: "No se pudo actualizar el estado del paquete",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Comprobante de pago subido exitosamente",
        description: "Tu pago ha sido confirmado. Ahora puedes proceder con la compra del producto.",
      });

      onUpload(receiptData);

    } catch (error: any) {
      console.error('Error uploading payment receipt:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al subir el archivo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Don't show if package is not in quote_accepted status
  if (pkg.status !== 'quote_accepted') {
    return null;
  }

  const isCompleted = !!pkg.payment_receipt;

  return (
    <Card className={isCompleted ? "border-success-border bg-success-muted" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Receipt className="h-5 w-5" />
          <span>Comprobante de Pago</span>
          {isCompleted && <CheckCircle className="h-5 w-5 text-success" />}
        </CardTitle>
        <CardDescription>
          {isCompleted 
            ? "✅ Comprobante de pago subido exitosamente"
            : "Sube tu comprobante de transferencia bancaria para aprobar tu pedido"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCompleted ? (
          <div className="flex items-center space-x-2 p-4 bg-success-muted border border-success-border rounded-lg">
            <CheckCircle className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm font-medium text-success-foreground">Comprobante de pago subido exitosamente</p>
              <p className="text-xs text-success-foreground/75">
                {(pkg.payment_receipt as any)?.filename} • {new Date((pkg.payment_receipt as any)?.uploadedAt).toLocaleDateString('es-GT')}
              </p>
            </div>
          </div>
        ) : (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              className="hidden"
            />
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Arrastra tu comprobante de pago aquí o haz clic para seleccionar
              </p>
              <Button 
                onClick={handleUploadClick}
                className="w-full"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Receipt className="h-4 w-4 mr-2" />
                    Subir Comprobante de Pago
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos permitidos: PDF, JPG, PNG, GIF, WebP. Máximo 5MB.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentReceiptUpload;