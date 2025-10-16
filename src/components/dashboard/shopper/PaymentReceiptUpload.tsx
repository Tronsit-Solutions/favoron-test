import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Check, Loader2, Eye, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Package } from "@/types";
import { useFavoronBankingInfo } from "@/hooks";

interface PaymentReceiptUploadProps {
  pkg: Package;
  onUploadComplete: (updatedPkg: Package) => void;
  onPickerOpen?: () => void;
  onPickerClose?: () => void;
}

type UploadState = 'ready' | 'uploading' | 'uploaded' | 'confirming' | 'confirmed';

const PaymentReceiptUpload = ({ pkg, onUploadComplete, onPickerOpen, onPickerClose }: PaymentReceiptUploadProps) => {
  const [uploadState, setUploadState] = useState<UploadState>(pkg.payment_receipt ? 'confirmed' : 'ready');
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
  } | null>(null);
  const [confirmedFile, setConfirmedFile] = useState<any>(pkg.payment_receipt);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { account: bankAccount, loading: bankLoading } = useFavoronBankingInfo(pkg.id);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    onPickerClose?.();
    const file = event.target.files?.[0];
    if (file) {
      uploadFileToStorage(file);
    }
    // Resetear el input para permitir seleccionar el mismo archivo nuevamente
    event.target.value = '';
  };

  const uploadFileToStorage = async (file: File) => {
    if (!file) return;

    console.log('📎 File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB'
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type);
      toast({
        title: "Tipo de archivo no válido",
        description: "Solo se permiten archivos JPG, PNG o PDF",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ File too large:', (file.size / (1024 * 1024)).toFixed(2) + 'MB');
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadState('uploading');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${pkg.id}_payment_receipt.${fileExt}`;
      const filePath = `${pkg.user_id}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Set pending file info for confirmation
      setPendingFile({
        file,
        fileName: file.name,
        filePath,
        fileSize: file.size,
        fileType: file.type
      });

      setUploadState('uploaded');

      toast({
        title: "Archivo subido",
        description: "Por favor confirma que el archivo es correcto antes de enviarlo.",
      });

    } catch (error: any) {
      console.error('❌ Error uploading file to storage:', {
        error: error.message,
        stack: error.stack,
        packageId: pkg.id
      });
      toast({
        title: "Error al subir archivo",
        description: error.message || "Ocurrió un error inesperado. Inténtalo nuevamente.",
        variant: "destructive",
      });
      setUploadState('ready');
    }
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;

    setUploadState('confirming');

    try {
      // 1. Obtener trust_level del usuario
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('trust_level')
        .eq('id', pkg.user_id)
        .single();

      if (profileError) throw profileError;

      const trustLevel = userProfile?.trust_level || 'basic';
      
      // 2. Auto-aprobar si es 'confiable' o 'prime'
      const autoApprove = ['confiable', 'prime'].includes(trustLevel);
      const newStatus = autoApprove ? 'pending_purchase' : 'payment_pending_approval';

      // 3. Metadata de auditoría
      const paymentReceiptData = {
        filename: pendingFile.fileName,
        filePath: pendingFile.filePath,
        uploadedAt: new Date().toISOString(),
        fileSize: pendingFile.fileSize,
        fileType: pendingFile.fileType,
        auto_approved: autoApprove,
        trust_level_at_upload: trustLevel
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
          status: newStatus,
          // Save traveler shipping information permanently
          ...(travelerShippingInfo && {
            traveler_address: travelerShippingInfo.travelerAddress,
            matched_trip_dates: travelerShippingInfo.tripDates
          })
        })
        .eq('id', pkg.id);

      if (updateError) throw updateError;

      // Update local state
      setConfirmedFile(paymentReceiptData);
      setPendingFile(null);
      setUploadState('confirmed');
      
      // Create updated package for parent
      const updatedPkg = {
        ...pkg,
        payment_receipt: paymentReceiptData,
        status: newStatus
      };
      
      // Call onUploadComplete with updated package
      onUploadComplete(updatedPkg);

      toast({
        title: autoApprove 
          ? "¡Pago confirmado automáticamente! ✨" 
          : "Comprobante confirmado exitosamente",
        description: autoApprove 
          ? "Tu pago ha sido aprobado automáticamente. Ya puedes compartir la información de envío con el viajero."
          : "Tu comprobante está pendiente de verificación por el administrador.",
      });

    } catch (error: any) {
      console.error('❌ Error confirming payment receipt:', {
        error: error.message,
        stack: error.stack,
        packageId: pkg.id
      });
      toast({
        title: "Error al confirmar comprobante",
        description: error.message || "Ocurrió un error inesperado. Inténtalo nuevamente.",
        variant: "destructive",
      });
      setUploadState('uploaded');
    }
  };

  const cancelUpload = async () => {
    if (!pendingFile) return;

    try {
      // Delete the file from storage
      const { error: deleteError } = await supabase.storage
        .from('payment-receipts')
        .remove([pendingFile.filePath]);

      if (deleteError) {
        console.error('❌ Error deleting file from storage:', deleteError);
      }

      setPendingFile(null);
      setUploadState('ready');

      toast({
        title: "Archivo cancelado",
        description: "Puedes subir un nuevo archivo.",
      });

    } catch (error: any) {
      console.error('❌ Error canceling upload:', error);
      toast({
        title: "Error al cancelar",
        description: "Hubo un problema. Inténtalo nuevamente.",
        variant: "destructive",
      });
    }
  };

  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    console.log('📂 Files dropped:', files.length);
    if (files.length > 0 && uploadState === 'ready') {
      uploadFileToStorage(files[0]);
    }
  };

  // Don't show upload form if payment has been approved by admin
  const paymentApprovedStatuses = ['payment_confirmed', 'paid', 'pending_purchase', 'purchased', 'shipped', 'matched', 'in_transit', 'received_by_traveler', 'delivered', 'pending_office_confirmation'];
  
  if (paymentApprovedStatuses.includes(pkg.status)) {
    return null; // Don't show anything - payment already processed
  }

  // Don't show the upload success message if payment has been approved by admin
  if (confirmedFile && !['payment_pending', 'payment_pending_approval'].includes(pkg.status)) {
    return null; // Hide success message after admin approval
  }

  // Show confirmed upload state
  if (uploadState === 'confirmed' || confirmedFile) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-lg p-3 h-fit max-w-md">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="h-3 w-3 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-success">Comprobante confirmado</p>
            <p className="text-xs text-success/80 truncate">{confirmedFile?.filename}</p>
          </div>
        </div>
        <p className="text-xs text-success/80">
          El administrador verificará tu pago pronto.
        </p>
      </div>
    );
  }

  // Show file confirmation view
  if ((uploadState === 'uploaded' || uploadState === 'confirming') && pendingFile) {
    const isConfirming = uploadState === 'confirming';
    
    return (
      <Card className="max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Confirmar comprobante</CardTitle>
          <CardDescription className="text-sm">
            Verifica que el archivo es correcto antes de enviarlo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-start space-x-3">
              {/* Preview */}
              <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {isImageFile(pendingFile.fileType) ? (
                  <img 
                    src={URL.createObjectURL(pendingFile.file)}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <FileText className="h-6 w-6 text-primary mb-1" />
                    <span className="text-xs text-primary">PDF</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pendingFile.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {(pendingFile.fileSize / (1024 * 1024)).toFixed(1)}MB • {pendingFile.fileType.split('/')[1].toUpperCase()}
                </p>
                <p className="text-xs text-primary mt-1">
                  {isImageFile(pendingFile.fileType) ? "Vista previa de imagen" : "Archivo PDF listo"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={confirmUpload} 
              className="flex-1"
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={cancelUpload}
              disabled={isConfirming}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Cambiar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div 
      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          {uploadState === 'uploading' ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : (
            <Upload className="h-6 w-6 text-primary" />
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {uploadState === 'uploading' ? "Subiendo comprobante..." : "Subir comprobante de pago"}
          </p>
          <p className="text-xs text-muted-foreground">
            Arrastra tu archivo aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-muted-foreground">
            Formatos permitidos: JPG, PNG, PDF (máx. 5MB)
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            console.log('🖱️ File selection button clicked');
            fileInputRef.current?.click();
          }}
          disabled={uploadState === 'uploading'}
        >
          <FileText className="h-4 w-4 mr-2" />
          Seleccionar archivo
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          className="hidden"
          onClick={(e) => {
            console.log('📁 File input clicked');
            e.stopPropagation();
            onPickerOpen?.();
          }}
        />
      </div>
    </div>
  );
};

export default PaymentReceiptUpload;