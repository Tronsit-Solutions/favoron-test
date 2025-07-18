import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Receipt, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Package } from "@/types";

interface PaymentReceiptUploadProps {
  pkg: Package;
  onUpload: (data: any) => void;
}

const PaymentReceiptUpload = ({ pkg, onUpload }: PaymentReceiptUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo no debe exceder 5MB",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const timestamp = Date.now();
      const fileName = `payment_receipt_${pkg.id}_${timestamp}.${file.name.split('.').pop()}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const receiptData = {
        type: 'payment_receipt',
        filePath,
        filename: file.name,
        uploadedAt: new Date().toISOString()
      };

      // Update package with payment receipt
      const { error: updateError } = await supabase
        .from('packages')
        .update({
          payment_receipt: receiptData,
          status: 'approved'
        })
        .eq('id', pkg.id);

      if (updateError) throw updateError;

      toast({
        title: "¡Éxito!",
        description: "Comprobante de pago subido correctamente",
      });

      onUpload(receiptData);
    } catch (error: any) {
      console.error('Error uploading payment receipt:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el comprobante de pago",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't show if package is not in quote_accepted status
  if (pkg.status !== 'quote_accepted') {
    return null;
  }

  // Show confirmation if payment receipt already exists
  if (pkg.payment_receipt) {
    return (
      <Card className="border-success-border bg-success-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <CheckCircle className="h-5 w-5" />
            Comprobante de Pago Subido
          </CardTitle>
          <CardDescription>
            Tu comprobante de pago ha sido recibido y está siendo procesado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-success">
            <Receipt className="h-4 w-4" />
            <span>Archivo: {(pkg.payment_receipt as any)?.filename}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-warning-border bg-warning-muted">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warning">
          <Receipt className="h-5 w-5" />
          Subir Comprobante de Pago
        </CardTitle>
        <CardDescription>
          Sube tu comprobante de transferencia bancaria para aprobar tu pedido
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="payment-receipt">Comprobante de Pago</Label>
          <Input
            id="payment-receipt"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Formatos permitidos: JPG, PNG, PDF. Tamaño máximo: 5MB
          </p>
        </div>

        {file && (
          <div className="p-3 bg-background rounded-lg border">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-success" />
              <span className="text-sm">{file.name}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Subir Comprobante
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentReceiptUpload;