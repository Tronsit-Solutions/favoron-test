import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Package } from "@/types";
import { useFavoronBankingInfo } from "@/hooks/useFavoronBankingInfo";
interface PaymentReceiptUploadProps {
  pkg: Package;
  onUploadComplete: (updatedPkg: Package) => void;
}

const PaymentReceiptUpload = ({ pkg, onUploadComplete }: PaymentReceiptUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(pkg.payment_receipt);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { account: bankAccount, loading: bankLoading } = useFavoronBankingInfo(pkg.id);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo no válido",
        description: "Solo se permiten archivos JPG, PNG o PDF",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${pkg.id}_payment_receipt.${fileExt}`;
      const filePath = `${pkg.user_id}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(filePath);

      // Update package with payment receipt info
      const paymentReceiptData = {
        filename: file.name,
        filePath,
        publicUrl,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        fileType: file.type
      };

      // Get traveler address and trip dates from package data to save permanently
      const pkgWithTrips = pkg as any;
      const travelerShippingInfo = pkgWithTrips.trips?.package_receiving_address ? {
        travelerAddress: pkgWithTrips.trips.package_receiving_address,
        tripDates: pkg.matched_trip_dates
      } : null;

      const { error: updateError } = await supabase
        .from('packages')
        .update({
          payment_receipt: paymentReceiptData,
          status: 'payment_pending_approval',
          // Save traveler shipping information permanently
          ...(travelerShippingInfo && {
            traveler_address: travelerShippingInfo.travelerAddress,
            matched_trip_dates: travelerShippingInfo.tripDates
          })
        })
        .eq('id', pkg.id);

      if (updateError) throw updateError;

      // Actualizar estado local inmediatamente
      setUploadedFile(paymentReceiptData);
      
      // Crear el paquete actualizado para pasarlo al parent
      const updatedPkg = {
        ...pkg,
        payment_receipt: paymentReceiptData,
        status: 'payment_pending_approval' as const
      };
      
      // Llamar onUploadComplete con el paquete actualizado
      onUploadComplete(updatedPkg);

      toast({
        title: "Comprobante subido exitosamente",
        description: "Tu pago ha sido registrado y está pendiente de verificación por el administrador.",
      });

    } catch (error: any) {
      console.error('Error uploading payment receipt:', error);
      toast({
        title: "Error al subir comprobante",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  if (uploadedFile) {
    return (
      <Card className="border-success">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
              <Check className="h-4 w-4 text-success" />
            </div>
            <div>
              <CardTitle className="text-success text-base">Comprobante de pago subido</CardTitle>
              <CardDescription className="text-success/80">
                Tu pago está siendo verificado
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="bg-success/5 border border-success/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-success" />
              <div className="flex-1">
                <p className="text-sm font-medium text-success">{uploadedFile.filename}</p>
                <p className="text-xs text-success/80">
                  Subido el {new Date(uploadedFile.uploadedAt).toLocaleDateString('es-GT')}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-success/80 mt-2">
            El administrador verificará tu pago y confirmará tu pedido pronto.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <Upload className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-foreground text-base">Subir comprobante de pago</CardTitle>
            <CardDescription>
              Sube tu comprobante de transferencia bancaria
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <p className="text-sm text-foreground">Subiendo comprobante...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-12 w-12 text-primary/60 mx-auto" />
              <p className="text-sm text-foreground font-medium">
                Arrastra tu comprobante aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground">
                Formatos permitidos: JPG, PNG, PDF • Máximo 5MB
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="mt-4 p-2 bg-info/5 border border-info/20 rounded-lg">
          <div className="space-y-2">
            <p className="text-xs text-foreground">
              <strong>Monto:</strong> Q{parseFloat((pkg.quote as any)?.totalPrice || '0').toFixed(2)} • <strong>Datos bancarios Favorón S.A.:</strong>
            </p>
            
            <div className="bg-background/50 border border-info/30 rounded-md p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Banco:</span>{' '}
                  <span className="font-medium text-foreground">{bankAccount?.bank_name || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Titular:</span>{' '}
                  <span className="font-medium text-foreground">{bankAccount?.account_holder || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cuenta:</span>{' '}
                  <span className="font-medium text-foreground">{bankAccount?.account_number || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{' '}
                  <span className="font-medium text-foreground">{bankAccount?.account_type || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentReceiptUpload;