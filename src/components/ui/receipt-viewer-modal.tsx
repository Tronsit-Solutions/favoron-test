import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, X, AlertCircle, RotateCcw } from "lucide-react";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { parseStorageRef } from "@/lib/storageUrls";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReceiptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl?: string;
  filename?: string;
  title?: string;
}

export function ReceiptViewerModal({ 
  isOpen, 
  onClose, 
  receiptUrl, 
  filename, 
  title = "Comprobante de pago" 
}: ReceiptViewerModalProps) {
  const [downloadingFile, setDownloadingFile] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const { url: signedUrl, loading, error, retryCount } = useSignedUrl(receiptUrl);

  const isImage = filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || receiptUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = filename?.match(/\.(pdf)$/i) || receiptUrl?.match(/\.(pdf)$/i);
  const displayUrl = signedUrl || receiptUrl;

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [triedBlob, setTriedBlob] = useState(false);

  useEffect(() => {
    setTriedBlob(false);
    let toRevoke: string | null = null;

    async function loadImage() {
      console.log('🔄 Cargando imagen:', { receiptUrl, signedUrl });
      
      // Try the signed URL first if available
      if (signedUrl && /^https?:\/\//i.test(signedUrl)) {
        console.log('✅ Usando signed URL');
        setImageSrc(signedUrl);
        return;
      }
      
      // For public URLs, use them directly
      if (receiptUrl && /^https?:\/\//i.test(receiptUrl)) {
        console.log('✅ Usando URL directa');
        // Add cache busting parameter to avoid cache issues
        const urlWithCache = receiptUrl + (receiptUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
        setImageSrc(urlWithCache);
        return;
      }
      
      // Fallback: download blob from storage
      if (receiptUrl && receiptUrl.includes('/')) {
        console.log('🔄 Intentando descarga desde Storage');
        const pathParts = receiptUrl.split('/');
        const bucketIndex = pathParts.findIndex(part => 
          part === 'payment-receipts' || 
          part === 'receipts' || 
          part === 'documents' ||
          part === 'purchase-confirmations'
        );
        
        if (bucketIndex > -1) {
          const bucket = pathParts[bucketIndex];
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          console.log('📁 Descargando desde bucket:', bucket, 'path:', filePath);
          
          try {
            const { data, error } = await supabase.storage.from(bucket).download(filePath);
            if (!error && data) {
              const url = URL.createObjectURL(data);
              toRevoke = url;
              setImageSrc(url);
              console.log('✅ Blob URL creada exitosamente');
            } else {
              console.error('❌ Error descargando imagen desde Storage:', error);
            }
          } catch (e) {
            console.error('❌ Error en descarga de Storage:', e);
          }
        }
      }
    }

    setImageSrc(null);
    if (isImage) loadImage();

    return () => {
      if (toRevoke) URL.revokeObjectURL(toRevoke);
    };
  }, [signedUrl, receiptUrl, isImage]);

  // Load PDF as blob when modal opens
  useEffect(() => {
    if (isOpen && isPDF) {
      loadPdfAsBlob();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isPDF, receiptUrl]);

  // Separate cleanup effect - only revoke when modal closes
  useEffect(() => {
    if (!isOpen && pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  }, [isOpen, pdfBlobUrl]);

  const loadPdfAsBlob = async () => {
    if (!receiptUrl) return;

    // Clean up any existing blob URL before creating a new one
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }

    setLoadingPdf(true);
    try {
      // Try to find bucket and path from URL
      const pathParts = receiptUrl.split('/');
      const bucketIndex = pathParts.findIndex(part => 
        part === 'payment-receipts' || 
        part === 'receipts' || 
        part === 'documents' ||
        part === 'purchase-confirmations'
      );
      
      if (bucketIndex > -1) {
        const bucket = pathParts[bucketIndex];
        const filePath = pathParts.slice(bucketIndex + 1).join('/');
        
        console.log('📁 Descargando PDF desde bucket:', bucket, 'path:', filePath);
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .download(filePath);

        if (!error && data) {
          // Ensure correct MIME type for PDF
          const pdfBlob = data.type === 'application/pdf' 
            ? data 
            : new Blob([data], { type: 'application/pdf' });
          const url = URL.createObjectURL(pdfBlob);
          setPdfBlobUrl(url);
          console.log('✅ PDF blob URL created from bucket:', bucket);
          return;
        } else {
          console.error('❌ Error descargando PDF:', error);
        }
      }
      
      // Fallback: try payment-receipts bucket with full path
      console.log('🔄 Intentando fallback payment-receipts con path:', receiptUrl);
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .download(receiptUrl);

      if (!error && data) {
        const pdfBlob = data.type === 'application/pdf' 
          ? data 
          : new Blob([data], { type: 'application/pdf' });
        const url = URL.createObjectURL(pdfBlob);
        setPdfBlobUrl(url);
        console.log('✅ PDF blob URL created from payment-receipts fallback');
      } else {
        console.error('❌ Fallback también falló:', error);
      }
    } catch (error) {
      console.error('❌ Error loading PDF as blob:', error);
    } finally {
      setLoadingPdf(false);
    }
  };
  const handleDownload = async () => {
    if (!receiptUrl && !signedUrl) return;
    
    setDownloadingFile(true);
    try {
      let blob: Blob | null = null;

      const effectiveUrl = (signedUrl || displayUrl || receiptUrl) as string | null;
      const isAbsolute = !!(effectiveUrl && /^https?:\/\//i.test(effectiveUrl));

      // 1) Intentar descargar vía URL absoluta (signed o pública)
      if (isAbsolute && effectiveUrl) {
        const response = await fetch(effectiveUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
        blob = await response.blob();
      }

      // 2) Si no funcionó, intentar desde Storage usando bucket y ruta
      if (!blob) {
        const ref = parseStorageRef(receiptUrl || signedUrl || '');
        if (ref) {
          const { data, error } = await supabase.storage.from(ref.bucket).download(ref.filePath);
          if (error || !data) throw error || new Error('No data from storage');
          blob = data;
        } else if (receiptUrl && !receiptUrl.includes('/') && !receiptUrl.startsWith('http')) {
          // Fallback for old entries that are just filenames - assume payment-receipts bucket
          const { data, error } = await supabase.storage.from('payment-receipts').download(receiptUrl);
          if (error || !data) throw error || new Error('No data from payment-receipts fallback');
          blob = data;
        }
      }

      if (!blob) throw new Error('No se pudo obtener el archivo');

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'archivo';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      toast.success("Archivo descargado exitosamente");
    } catch (error) {
      console.error('Error downloading file:', error);
      const fallbackUrl = (signedUrl || displayUrl || receiptUrl) as string | undefined;
      if (fallbackUrl && /^https?:\/\//i.test(fallbackUrl)) {
        window.open(fallbackUrl, '_blank');
      }
      toast.error("Error al descargar el archivo. Intentamos abrirlo en otra pestaña.");
    } finally {
      setDownloadingFile(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title} - {filename}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {loading && (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando comprobante...</p>
              {retryCount > 0 && (
                <p className="text-sm text-gray-500 mt-2">Reintento {retryCount}/2</p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 rounded-lg p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <p className="text-red-700 mb-4">No se pudo cargar el comprobante</p>
              <p className="text-sm text-red-600 mb-4">URL: {receiptUrl}</p>
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(displayUrl || receiptUrl, '_blank')}
                >
                  Abrir en nueva pestaña
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Recargar página
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && displayUrl && (
            <div className="bg-muted/30 rounded-lg p-4">
              {isImage ? (
                <div className="relative">
                  <img 
                    src={imageSrc || displayUrl || ''} 
                    alt={title}
                    className="w-full h-auto rounded-lg shadow-sm min-h-[200px] max-h-[70vh] object-contain bg-background border border-border" loading="lazy" decoding="async" referrerPolicy="no-referrer" onClick={() => { const url = imageSrc || displayUrl || ''; if (url) window.open(url, '_blank'); }}
                    crossOrigin="anonymous"
                    onLoad={() => {
                      console.log('✅ Imagen cargada exitosamente:', {
                        source: imageSrc ? 'blob' : 'url',
                        displayUrl,
                        signedUrl,
                        receiptUrl,
                        filename
                      });
                    }}
                    onError={async (e) => {
                      console.error('❌ Error al cargar imagen:', e.currentTarget.src);
                      if (!triedBlob && receiptUrl) {
                        setTriedBlob(true);
                        // Para URLs públicas, intentar acceso directo sin signed URL
                        if (receiptUrl.includes('public/payment-receipts/')) {
                          const directUrl = receiptUrl.replace('/storage/v1/object/public/', '/storage/v1/object/public/');
                          console.log('🔄 Intentando URL directa:', directUrl);
                          setImageSrc(directUrl);
                          return;
                        }
                        // Para otros casos, intentar descarga desde Storage
                        if (receiptUrl.includes('/')) {
                          const pathParts = receiptUrl.split('/');
                          const bucketIndex = pathParts.findIndex(part => part === 'payment-receipts' || part === 'receipts' || part === 'documents');
                          if (bucketIndex > -1) {
                            const bucket = pathParts[bucketIndex];
                            const filePath = pathParts.slice(bucketIndex + 1).join('/');
                            try {
                              const { data, error } = await supabase.storage.from(bucket).download(filePath);
                              if (!error && data) {
                                const url = URL.createObjectURL(data);
                                setImageSrc(url);
                              } else {
                                console.error('Error descargando desde Storage:', error);
                              }
                            } catch (err) {
                              console.error('Fallback download failed:', err);
                            }
                          }
                        }
                      }
                    }}
                  />
                  {!imageSrc && !displayUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground text-sm">No se pudo cargar la imagen</p>
                    </div>
                  )}
                </div>
              ) : isPDF ? (
                <div className="relative">
                  {loadingPdf ? (
                    <div className="w-full h-[70vh] bg-gray-100 rounded-lg border flex items-center justify-center">
                      <p className="text-gray-500">Cargando PDF...</p>
                    </div>
                  ) : pdfBlobUrl ? (
                    <iframe
                      src={pdfBlobUrl}
                      title={title}
                      className="w-full h-[70vh] rounded-lg border"
                    />
                  ) : (
                    <div className="w-full h-[70vh] bg-gray-100 rounded-lg border flex flex-col items-center justify-center">
                      <FileText className="h-16 w-16 mb-4 text-gray-400" />
                      <p className="text-gray-500 mb-4">No se pudo cargar el PDF</p>
                      <Button variant="outline" onClick={handleDownload} disabled={downloadingFile}>
                        <Download className="h-4 w-4 mr-1" /> {downloadingFile ? "Descargando..." : "Descargar"}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Vista previa no disponible para este tipo de archivo</p>
                  <Button onClick={handleDownload} disabled={downloadingFile}>
                    <Download className="h-4 w-4 mr-2" />
                    {downloadingFile ? "Descargando..." : "Descargar archivo"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleDownload} disabled={downloadingFile || !displayUrl}>
            <Download className="h-4 w-4 mr-2" />
            {downloadingFile ? "Descargando..." : "Descargar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}