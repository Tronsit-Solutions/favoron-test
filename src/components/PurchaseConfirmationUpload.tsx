import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, Loader2, Eye, RefreshCw, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePackageChat } from "@/hooks/usePackageChat";
import { normalizeConfirmations, ConfirmationDocument } from "@/utils/confirmationHelpers";

interface PurchaseConfirmationUploadProps {
  packageId: string;
  currentConfirmation?: any;
  onUpload: (data: any) => void;
}

type UploadState = 'ready' | 'uploading' | 'uploaded' | 'confirming';

const PurchaseConfirmationUpload = ({ 
  packageId, 
  currentConfirmation, 
  onUpload 
}: PurchaseConfirmationUploadProps) => {
  const existingFiles = normalizeConfirmations(currentConfirmation);
  const [uploadState, setUploadState] = useState<UploadState>('ready');
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendMessage } = usePackageChat({ packageId });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFileToStorage(file);
    }
    event.target.value = '';
  };

  const uploadFileToStorage = async (file: File) => {
    if (!file || !user) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten archivos JPG, PNG, GIF, WebP o PDF",
        variant: "destructive",
      });
      return;
    }

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
      const fileExtension = file.name.split('.').pop();
      const fileName = `purchase_confirmation_${packageId}_${Date.now()}.${fileExtension}`;
      const filePath = `${user.id}/${fileName}`;
      const bucketName = 'purchase-confirmations';

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
    if (!pendingFile || !user) return;

    setUploadState('confirming');

    try {
      const newDoc: ConfirmationDocument = {
        filename: pendingFile.fileName,
        uploadedAt: new Date().toISOString(),
        type: 'purchase_confirmation',
        filePath: pendingFile.filePath,
        bucket: 'purchase-confirmations',
        mimeType: pendingFile.fileType,
        size: pendingFile.fileSize,
      };

      // Merge with existing confirmations
      const allConfirmations = [...existingFiles, newDoc];
      
      // Call parent with the full array
      onUpload(allConfirmations);
      
      await sendMessage(`📄 He subido la confirmación de compra: ${pendingFile.fileName}`, 'status_update');
      
      // Reset to ready so user can upload more
      setPendingFile(null);
      setUploadState('ready');
      
      toast({
        title: "Confirmación de compra subida",
        description: existingFiles.length > 0 
          ? `Ahora tienes ${allConfirmations.length} comprobante(s) subidos. Puedes agregar más si lo necesitas.`
          : "Puedes agregar más comprobantes si tienes varias compras.",
      });

    } catch (error: any) {
      console.error('❌ Error confirming purchase confirmation:', error);
      toast({
        title: "Error al confirmar",
        description: "No se pudo confirmar la confirmación de compra",
        variant: "destructive",
      });
      setUploadState('uploaded');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleTryAgain = () => {
    setPendingFile(null);
    setUploadState('ready');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Confirmación de Compra</span>
        {existingFiles.length > 0 && (
          <span className="text-xs bg-success/10 text-success px-1.5 py-0.5 rounded-full font-medium">
            {existingFiles.length} subido{existingFiles.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Show already-uploaded files */}
      {existingFiles.length > 0 && (
        <div className="space-y-1">
          {existingFiles.map((doc, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-success/10 border border-success/20 rounded-md">
              <CheckCircle className="h-3 w-3 text-success flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{doc.filename || `Comprobante ${index + 1}`}</p>
                {doc.uploadedAt && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(doc.uploadedAt).toLocaleDateString('es-GT')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload area */}
      {uploadState === 'ready' && (
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
              {existingFiles.length > 0 
                ? "¿Tienes más comprobantes? Súbelos aquí"
                : "Sube tu confirmación de compra (screenshot, factura, email)"}
            </p>
            <Button 
              onClick={handleUploadClick}
              size="sm"
              variant={existingFiles.length > 0 ? "outline" : "default"}
              className="w-full"
            >
              {existingFiles.length > 0 ? (
                <>
                  <Plus className="h-3 w-3 mr-2" />
                  Agregar Otro Comprobante
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3 mr-2" />
                  Subir Confirmación
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            PDF, JPG, PNG, GIF, WebP. Máximo 5MB.
          </p>
        </>
      )}

      {uploadState === 'uploading' && (
        <div className="border-2 border-dashed border-primary/25 rounded-md p-4 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground mb-3">Subiendo archivo...</p>
          <Button size="sm" disabled className="w-full">
            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            Subiendo...
          </Button>
        </div>
      )}

      {uploadState === 'uploaded' && (
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
      )}

      {uploadState === 'confirming' && (
        <div className="border-2 border-dashed border-primary/25 rounded-md p-4 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground mb-3">Confirmando comprobante...</p>
          <Button size="sm" disabled className="w-full">
            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            Confirmando...
          </Button>
        </div>
      )}
    </div>
  );
};

export default PurchaseConfirmationUpload;
