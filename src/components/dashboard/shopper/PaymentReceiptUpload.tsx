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

      // Update package with payment receipt info
      const paymentReceiptData = {
        filename: file.name,
        filePath,
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

  // Don't show upload form if payment has been approved by admin
  const paymentApprovedStatuses = ['payment_confirmed', 'paid', 'pending_purchase', 'purchased', 'shipped', 'matched', 'in_transit', 'received_by_traveler', 'delivered', 'pending_office_confirmation'];
  
  if (paymentApprovedStatuses.includes(pkg.status)) {
    return null; // Don't show anything - payment already processed
  }

  // Don't show the upload success message if payment has been approved by admin
  if (uploadedFile && !['payment_pending', 'payment_pending_approval'].includes(pkg.status)) {
    return null; // Hide success message after admin approval
  }

  if (uploadedFile) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-lg p-3 h-fit max-w-md">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="h-3 w-3 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-success">Comprobante subido</p>
            <p className="text-xs text-success/80 truncate">{uploadedFile.filename}</p>
          </div>
        </div>
        <p className="text-xs text-success/80">
          El administrador verificará tu pago pronto.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-transparent border border-primary/40 rounded-md p-1.5 space-y-1.5 h-full flex-1">
      {/* Header - More compact */}
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Upload className="h-2.5 w-2.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-primary">¡Sube tu comprobante de pago!</h3>
          <p className="text-xs text-foreground/80">Monto: Q{parseFloat((pkg.quote as any)?.totalPrice || '0').toFixed(2)}</p>
        </div>
      </div>

      {/* Banking Info - Very compact - MOVED TO TOP */}
      <div className="bg-info/5 border border-info/20 rounded-md p-2">
        <p className="text-xs font-medium text-foreground mb-1">Datos bancarios Favorón:</p>
        {bankLoading ? (
          <p className="text-xs text-muted-foreground">Cargando...</p>
        ) : bankAccount ? (
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Banco:</span>
              <span className="font-medium">{bankAccount.bank_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cuenta:</span>
              <span className="font-medium">{bankAccount.account_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Titular:</span>
              <span className="font-medium">{bankAccount.account_holder}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Info no disponible. Contacta soporte.
          </p>
        )}
      </div>

      {/* Upload Area - More compact */}
      <div
        className="border-2 border-dashed border-primary/50 rounded-md p-3 text-center hover:border-primary/70 transition-colors cursor-pointer bg-primary/5"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="space-y-1">
            <Loader2 className="h-5 w-5 text-primary animate-spin mx-auto" />
            <p className="text-xs text-foreground">Subiendo...</p>
          </div>
        ) : (
          <div className="space-y-1">
            <Upload className="h-5 w-5 text-primary/70 mx-auto" />
            <p className="text-xs text-foreground font-medium">
              Arrastra tu comprobante aquí
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, PDF • Max 5MB
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
    </div>
  );
};

export default PaymentReceiptUpload;
