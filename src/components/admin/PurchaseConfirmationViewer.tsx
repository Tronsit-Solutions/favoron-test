
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Eye, Download, ExternalLink, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PurchaseConfirmationViewerProps {
  purchaseConfirmation: {
    filename?: string;
    uploadedAt?: string;
    type?: string;
    filePath?: string;
    bucket?: string;
  };
  packageId: string;
  className?: string;
  onDelete?: () => void;
}

const DEFAULT_BUCKETS_ORDER = ['purchase-confirmations', 'payment-receipts', 'product-receipts'] as const;

const PurchaseConfirmationViewer = ({ purchaseConfirmation, packageId, className, onDelete }: PurchaseConfirmationViewerProps) => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const { toast } = useToast();

  const isImage = purchaseConfirmation.filename?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
  const isPDF = purchaseConfirmation.filename?.toLowerCase().match(/\.pdf$/);

  // Auto-generate signed URL on mount
  useEffect(() => {
    if (!signedUrl) {
      generateSignedUrl();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedUrl]);

  // Load PDF as blob when modal opens
  useEffect(() => {
    if (showModal && isPDF && !pdfBlobUrl) {
      loadPdfAsBlob();
    }
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, isPDF]);

  const loadPdfAsBlob = async () => {
    setLoadingPdf(true);
    try {
      let filePath: string;
      if ('filePath' in purchaseConfirmation && purchaseConfirmation.filePath) {
        filePath = purchaseConfirmation.filePath;
      } else {
        filePath = `${packageId}/${purchaseConfirmation.filename}`;
      }

      const bucketsToTry = resolveBuckets();
      for (const bucket of bucketsToTry) {
        const { data, error } = await supabase.storage
          .from(bucket)
          .download(filePath);

        if (!error && data) {
          // Ensure the blob has the correct MIME type for PDF rendering
          const pdfBlob = data instanceof Blob && data.type === 'application/pdf'
            ? data
            : new Blob([data], { type: 'application/pdf' });
          const url = URL.createObjectURL(pdfBlob);
          setPdfBlobUrl(url);
          console.log('PDF blob URL created from bucket:', bucket);
          return;
        }
      }
      console.error('Failed to load PDF as blob from any bucket');
    } catch (error) {
      console.error('Error loading PDF as blob:', error);
    } finally {
      setLoadingPdf(false);
    }
  };

  const resolveBuckets = (): string[] => {
    // Si viene bucket en el objeto, lo usamos primero; luego fallback al orden por defecto
    const preferred = purchaseConfirmation.bucket ? [purchaseConfirmation.bucket] : [];
    const rest = DEFAULT_BUCKETS_ORDER.filter(b => !preferred.includes(b));
    return [...preferred, ...rest];
  };

  const generateSignedUrl = async () => {
    if (signedUrl) return signedUrl;
    
    setLoading(true);
    try {
      // Determine the correct file path
      let filePath: string;
      
      if ('filePath' in purchaseConfirmation && purchaseConfirmation.filePath) {
        filePath = purchaseConfirmation.filePath;
      } else {
        // Old format: construct path with packageId
        filePath = `${packageId}/${purchaseConfirmation.filename}`;
      }

      console.log('Attempting to access file at path:', filePath);

      // Try in preferred bucket, then fallbacks
      const bucketsToTry = resolveBuckets();
      console.log('Buckets to try for purchase confirmation:', bucketsToTry);

      for (const bucket of bucketsToTry) {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (!error && data?.signedUrl) {
          console.log('Signed URL generated from bucket:', bucket);
          setSignedUrl(data.signedUrl);
          return data.signedUrl;
        } else {
          console.warn(`Failed to generate signed URL from ${bucket}`, error);
        }
      }

      // If all attempts failed
      toast({
        title: "Error",
        description: "No se pudo generar la URL para mostrar el archivo",
        variant: "destructive",
      });
      return null;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la URL para mostrar el archivo",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleView = async () => {
    const url = await generateSignedUrl();
    if (url) {
      if (isImage || isPDF) {
        setShowModal(true);
      } else {
        window.open(url, '_blank');
      }
    }
  };

  const handleDownload = async () => {
    const url = await generateSignedUrl();
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = purchaseConfirmation.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Descarga iniciada",
        description: "El comprobante de compra se está descargando",
      });
    }
  };

  return (
    <>
      <Card className={`border-purple-200 bg-purple-50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg text-purple-700">
            <FileText className="h-5 w-5" />
            <span>Comprobante de Compra</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-purple-600">
              <p><strong>Archivo:</strong> {purchaseConfirmation.filename}</p>
              {purchaseConfirmation.uploadedAt && (
                <p><strong>Subido:</strong> {new Date(purchaseConfirmation.uploadedAt).toLocaleDateString('es-GT')}</p>
              )}
            </div>

            {/* Preview thumbnail for images */}
            {isImage && (
              <div className="mt-3">
                {signedUrl ? (
                  <img 
                    src={signedUrl} 
                    alt="Vista previa del comprobante"
                    className="max-w-32 max-h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleView}
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-200 rounded border flex items-center justify-center">
                    <p className="text-gray-500 text-sm">Cargando...</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleView}
                disabled={loading}
                className="text-purple-600 border-purple-300 hover:bg-purple-100"
              >
                {loading ? (
                  "Cargando..."
                ) : (
                  <>
                    {(isImage || isPDF) ? <Eye className="h-4 w-4 mr-1" /> : <ExternalLink className="h-4 w-4 mr-1" />}
                    {isImage ? 'Ver' : isPDF ? 'Ver PDF' : 'Abrir'}
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={loading}
                className="text-purple-600 border-purple-300 hover:bg-purple-100"
              >
                <Download className="h-4 w-4 mr-1" />
                Descargar
              </Button>

              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={loading || deleting}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal for image preview */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Comprobante de Compra - {purchaseConfirmation.filename}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {signedUrl && isImage && (
              <img 
                src={signedUrl} 
                alt="Comprobante de compra"
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
            {isPDF && (
              loadingPdf ? (
                <div className="w-full h-[70vh] bg-gray-100 rounded-lg border flex items-center justify-center">
                  <p className="text-gray-500">Cargando PDF...</p>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  title="Comprobante de compra"
                  className="w-full h-[70vh] rounded-lg border"
                />
              ) : (
                <div className="w-full h-[70vh] bg-gray-100 rounded-lg border flex flex-col items-center justify-center">
                  <FileText className="h-16 w-16 mb-4 text-gray-400" />
                  <p className="text-gray-500 mb-4">No se pudo cargar el PDF</p>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-1" /> Descargar
                  </Button>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comprobante de compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El comprobante de compra será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setDeleting(true);
                try {
                  if (onDelete) {
                    await onDelete();
                  }
                  setShowDeleteDialog(false);
                } finally {
                  setDeleting(false);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PurchaseConfirmationViewer;
