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

  return null;
};

export default PaymentReceiptUpload;
