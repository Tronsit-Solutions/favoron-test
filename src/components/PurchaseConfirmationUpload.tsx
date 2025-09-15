import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, Loader2, Eye, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePackageChat } from "@/hooks/usePackageChat";

interface PurchaseConfirmationUploadProps {
  packageId: string;
  currentConfirmation?: any;
  onUpload: (data: any) => void;
}

type UploadState = 'ready' | 'uploading' | 'uploaded' | 'confirming' | 'confirmed';

const PurchaseConfirmationUpload = ({ 
  packageId, 
  currentConfirmation, 
  onUpload 
}: PurchaseConfirmationUploadProps) => {
  const [uploadState, setUploadState] = useState<UploadState>(currentConfirmation ? 'confirmed' : 'ready');
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
  } | null>(null);
  const [confirmedFile, setConfirmedFile] = useState<any>(currentConfirmation);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendMessage } = usePackageChat({ packageId });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFileToStorage(file);
    }
    // Reset file input
    event.target.value = '';
  };

  const uploadFileToStorage = async (file: File) => {
    if (!file || !user) return;

    console.log('📎 File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB'
    });

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

    setUploadState('uploading');

    try {
      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `purchase_confirmation_${packageId}_${Date.now()}.${fileExtension}`;
      const filePath = `${user.id}/${fileName}`;
      const bucketName = 'purchase-confirmations';

      console.log('📤 Uploading to Storage:', { fileName, filePath, bucketName });

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        toast({
          title: "Error al subir archivo",
          description: "No se pudo subir el archivo. Intenta de nuevo.",
          variant: "destructive",
        });
        setUploadState('ready');
        return;
      }

      console.log('✅ File uploaded successfully to storage');

      // Store pending file info for confirmation step
      setPendingFile({
        file,
        fileName: file.name,
        filePath,
        fileSize: file.size,
        fileType: file.type,
      });

      setUploadState('uploaded');

      toast({
        title: "Archivo subido exitosamente",
        description: "Ahora confirma para procesar la confirmación de compra",
      });

    } catch (error: any) {
      console.error('❌ Unexpected error during upload:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al subir el archivo",
        variant: "destructive",
      });
      setUploadState('ready');
    }
  };

  const confirmPurchaseConfirmation = async () => {
    if (!pendingFile || !user) {
      console.error('❌ No pending file or user for confirmation');
      return;
    }

    console.log('✅ Confirming purchase confirmation...');
    setUploadState('confirming');

    try {
      // Create confirmation data
      const confirmationData = {
        filename: pendingFile.fileName,
        uploadedAt: new Date().toISOString(),
        type: 'purchase_confirmation',
        filePath: pendingFile.filePath,
        bucket: 'purchase-confirmations',
        mimeType: pendingFile.fileType,
        size: pendingFile.fileSize,
      };

      console.log('📝 Purchase confirmation data prepared:', confirmationData);
      
      // Call parent's onUpload to update the package
      onUpload(confirmationData);
      
      // Send message to chat about the uploaded confirmation
      await sendMessage(`📄 He subido la confirmación de compra: ${pendingFile.fileName}`, 'status_update');
      
      // Update local state
      setConfirmedFile(confirmationData);
      setUploadState('confirmed');
      
      toast({
        title: "Confirmación de compra confirmada exitosamente",
        description: "El viajero puede ver tu confirmación de compra. El tracking es independiente y puedes agregarlo cuando quieras.",
      });

    } catch (error: any) {
      console.error('❌ Error confirming purchase confirmation:', {
        error: error.message,
        pendingFile
      });
      toast({
        title: "Error al confirmar",
        description: "No se pudo confirmar la confirmación de compra",
        variant: "destructive",
      });
      setUploadState('uploaded'); // Go back to uploaded state for retry
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleTryAgain = () => {
    setPendingFile(null);
    setUploadState('ready');
  };

  const getStateDisplay = () => {
    switch (uploadState) {
      case 'ready':
        return (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              className="hidden"
            />
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-4 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mb-3">
                Sube tu confirmación de compra (screenshot, factura, email)
              </p>
              <Button 
                onClick={handleUploadClick}
                size="sm"
                className="w-full"
              >
                <FileText className="h-3 w-3 mr-2" />
                Subir Confirmación
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, JPG, PNG, GIF, WebP. Máximo 5MB.
            </p>
          </>
        );

      case 'uploading':
        return (
          <div className="border-2 border-dashed border-primary/25 rounded-md p-4 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground mb-3">
              Subiendo archivo...
            </p>
            <Button size="sm" disabled className="w-full">
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Subiendo...
            </Button>
          </div>
        );

      case 'uploaded':
        return (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-primary/50 rounded-md p-4 space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pendingFile?.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {pendingFile && (pendingFile.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 w-full">
                <Button 
                  onClick={confirmPurchaseConfirmation}
                  size="sm" 
                  className="w-full px-4 py-2 text-sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="flex-1">Confirmar Subida</span>
                </Button>
                <Button 
                  onClick={handleTryAgain}
                  size="sm" 
                  variant="outline"
                  className="w-full px-4 py-2 text-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="flex-1">Intentar de Nuevo</span>
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Revisa que sea el archivo correcto antes de confirmar
            </p>
          </div>
        );

      case 'confirming':
        return (
          <div className="border-2 border-dashed border-primary/25 rounded-md p-4 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground mb-3">
              Confirmando comprobante...
            </p>
            <Button size="sm" disabled className="w-full">
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Confirmando...
            </Button>
          </div>
        );

      case 'confirmed':
        return (
          <div className="flex items-center space-x-2 p-3 bg-success/10 border border-success/20 rounded-md">
            <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-success-foreground">Confirmación subida</p>
              <p className="text-xs text-success-foreground/75 truncate">
                {confirmedFile?.filename} • {confirmedFile && new Date(confirmedFile.uploadedAt).toLocaleDateString('es-GT')}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isCompleted = uploadState === 'confirmed';

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Confirmación de Compra</span>
        {isCompleted && <CheckCircle className="h-4 w-4 text-success" />}
      </div>
      
      {getStateDisplay()}
    </div>
  );
};

export default PurchaseConfirmationUpload;