import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, Loader2, RefreshCw, Plus } from "lucide-react";
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

interface PendingFile {
  file: File;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
}

const PurchaseConfirmationUpload = ({ 
  packageId, 
  currentConfirmation, 
  onUpload 
}: PurchaseConfirmationUploadProps) => {
  const existingFiles = normalizeConfirmations(currentConfirmation);
  const [uploadState, setUploadState] = useState<UploadState>('ready');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendMessage } = usePackageChat({ packageId });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadFilesToStorage(Array.from(files));
    }
    event.target.value = '';
  };

  const uploadFilesToStorage = async (files: File[]) => {
    if (!files.length || !user) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({ title: "Formato no válido", description: `${file.name}: Solo JPG, PNG, GIF, WebP o PDF`, variant: "destructive" });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Archivo muy grande", description: `${file.name}: Debe ser menor a 5MB`, variant: "destructive" });
        return false;
      }
      return true;
    });

    if (!validFiles.length) return;

    setUploadState('uploading');

    try {
      const uploaded: PendingFile[] = [];
      const bucketName = 'purchase-confirmations';

      for (const file of validFiles) {
        const fileExtension = file.name.split('.').pop();
        const fileName = `purchase_confirmation_${packageId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${fileExtension}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file);

        if (uploadError) {
          console.error('❌ Storage upload error:', uploadError);
          toast({ title: "Error al subir", description: `No se pudo subir ${file.name}`, variant: "destructive" });
          continue;
        }

        uploaded.push({ file, fileName: file.name, filePath, fileSize: file.size, fileType: file.type });
      }

      if (uploaded.length === 0) {
        setUploadState('ready');
        return;
      }

      setPendingFiles(uploaded);
      setUploadState('uploaded');

      toast({
        title: `${uploaded.length} archivo(s) subido(s)`,
        description: "Confirma para procesar las confirmaciones de compra",
      });
    } catch (error: any) {
      console.error('❌ Unexpected error during upload:', error);
      toast({ title: "Error inesperado", description: "Ocurrió un error al subir los archivos", variant: "destructive" });
      setUploadState('ready');
    }
  };

  const confirmPurchaseConfirmation = async () => {
    if (!pendingFiles.length || !user) return;

    setUploadState('confirming');

    try {
      const newDocs: ConfirmationDocument[] = pendingFiles.map(pf => ({
        filename: pf.fileName,
        uploadedAt: new Date().toISOString(),
        type: 'purchase_confirmation' as const,
        filePath: pf.filePath,
        bucket: 'purchase-confirmations',
        mimeType: pf.fileType,
        size: pf.fileSize,
      }));

      const allConfirmations = [...existingFiles, ...newDocs];
      onUpload(allConfirmations);

      const fileNames = pendingFiles.map(pf => pf.fileName).join(', ');
      await sendMessage(`📄 He subido ${pendingFiles.length} confirmación(es) de compra: ${fileNames}`, 'status_update');

      setPendingFiles([]);
      setUploadState('ready');

      toast({
        title: "Confirmaciones de compra subidas",
        description: `Ahora tienes ${allConfirmations.length} comprobante(s). Puedes agregar más si lo necesitas.`,
      });
    } catch (error: any) {
      console.error('❌ Error confirming purchase confirmation:', error);
      toast({ title: "Error al confirmar", description: "No se pudo confirmar las confirmaciones", variant: "destructive" });
      setUploadState('uploaded');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleTryAgain = () => {
    setPendingFiles([]);
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

      {uploadState === 'ready' && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,.pdf"
            multiple
            className="hidden"
          />
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-4 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-3">
              {existingFiles.length > 0 
                ? "¿Tienes más comprobantes? Súbelos aquí (puedes seleccionar varios)"
                : "Sube tus confirmaciones de compra (puedes seleccionar varios archivos)"}
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
                  Agregar Más Comprobantes
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3 mr-2" />
                  Subir Confirmaciones
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            PDF, JPG, PNG, GIF, WebP. Máximo 5MB por archivo. Puedes seleccionar varios.
          </p>
        </>
      )}

      {uploadState === 'uploading' && (
        <div className="border-2 border-dashed border-primary/25 rounded-md p-4 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground mb-3">Subiendo archivos...</p>
          <Button size="sm" disabled className="w-full">
            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            Subiendo...
          </Button>
        </div>
      )}

      {uploadState === 'uploaded' && (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-primary/50 rounded-md p-4 space-y-4">
            {pendingFiles.map((pf, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pf.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(pf.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
            
            <div className="flex flex-col gap-3 w-full">
              <Button 
                onClick={confirmPurchaseConfirmation}
                size="sm" 
                className="w-full px-4 py-2 text-sm"
              >
                <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="flex-1">Confirmar {pendingFiles.length} archivo(s)</span>
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
            Revisa que sean los archivos correctos antes de confirmar
          </p>
        </div>
      )}

      {uploadState === 'confirming' && (
        <div className="border-2 border-dashed border-primary/25 rounded-md p-4 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground mb-3">Confirmando comprobantes...</p>
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
