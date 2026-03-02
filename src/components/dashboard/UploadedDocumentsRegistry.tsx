import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Truck, CreditCard, Eye, Edit } from "lucide-react";
import { Package } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { normalizeConfirmations } from "@/utils/confirmationHelpers";

interface UploadedDocumentsRegistryProps {
  pkg: Package;
  className?: string;
  onEditDocument?: (type: 'payment_receipt' | 'purchase_confirmation' | 'tracking_info') => void;
}

interface DocumentData {
  filename?: string;
  uploadedAt?: string;
  filePath?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  timestamp?: string;
}

const UploadedDocumentsRegistry = ({ pkg, className, onEditDocument }: UploadedDocumentsRegistryProps) => {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<{ url: string; title: string } | null>(null);

  const viewPaymentReceipt = async (paymentData: DocumentData) => {
    if (paymentData.filePath) {
      try {
        const { data, error } = await supabase.storage
          .from('payment-receipts')
          .createSignedUrl(paymentData.filePath, 3600);
        if (error) {
          toast({ title: "Error", description: "No se pudo acceder al comprobante de pago", variant: "destructive" });
          return;
        }
        setModalImage({ url: data.signedUrl, title: "Comprobante de pago" });
        setModalOpen(true);
      } catch (error) {
        toast({ title: "Error", description: "Ocurrió un error al cargar el archivo", variant: "destructive" });
      }
    }
  };

  const viewPurchaseConfirmation = async (confirmationData: DocumentData) => {
    if (confirmationData.filePath) {
      try {
        const { data, error } = await supabase.storage
          .from('purchase-confirmations')
          .createSignedUrl(confirmationData.filePath, 3600);
        if (error) {
          toast({ title: "Error", description: "No se pudo acceder al comprobante de compra", variant: "destructive" });
          return;
        }
        setModalImage({ url: data.signedUrl, title: "Confirmación de compra" });
        setModalOpen(true);
      } catch (error) {
        toast({ title: "Error", description: "Ocurrió un error al cargar el archivo", variant: "destructive" });
      }
    }
  };

  const paymentReceipt = pkg.payment_receipt as DocumentData | null;
  const confirmations = normalizeConfirmations(pkg.purchase_confirmation);
  const trackingInfo = pkg.tracking_info as DocumentData | null;

  const uploadedCount = (paymentReceipt ? 1 : 0) + confirmations.length + (trackingInfo ? 1 : 0);

  if (uploadedCount === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Documentos Subidos</span>
        <Badge variant="secondary" className="text-xs h-5">
          {uploadedCount}
        </Badge>
      </div>
      
      <div className="space-y-2">
        {/* Payment Receipt */}
        {paymentReceipt && (
          <div className="flex items-center justify-between p-2 bg-muted/20 rounded-md border">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <CreditCard className="h-3 w-3 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">Comprobante de pago</p>
                <p className="text-xs text-muted-foreground truncate">
                  {paymentReceipt.filename || 'Comprobante subido'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {paymentReceipt.uploadedAt && (
                <span className="text-xs text-muted-foreground">
                  {new Date(paymentReceipt.uploadedAt).toLocaleDateString('es-GT')}
                </span>
              )}
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => viewPaymentReceipt(paymentReceipt)} title="Ver documento">
                <Eye className="h-3 w-3" />
              </Button>
              {onEditDocument && (
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onEditDocument('payment_receipt')} title="Editar documento">
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Purchase Confirmations - render each file as a row */}
        {confirmations.map((confirmation, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded-md border">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <FileText className="h-3 w-3 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">
                  Confirmación de compra{confirmations.length > 1 ? ` (${index + 1})` : ''}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {confirmation.filename || 'Confirmación subida'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {confirmation.uploadedAt && (
                <span className="text-xs text-muted-foreground">
                  {new Date(confirmation.uploadedAt).toLocaleDateString('es-GT')}
                </span>
              )}
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => viewPurchaseConfirmation(confirmation as DocumentData)} title="Ver documento">
                <Eye className="h-3 w-3" />
              </Button>
              {onEditDocument && (
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onEditDocument('purchase_confirmation')} title="Editar documento">
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Tracking Information */}
        {trackingInfo && (
          <div className="p-2 bg-muted/20 rounded-md border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <Truck className="h-3 w-3 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">Información de seguimiento</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {trackingInfo.trackingNumber && `#${trackingInfo.trackingNumber}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {trackingInfo.timestamp && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(trackingInfo.timestamp).toLocaleDateString('es-GT')}
                  </span>
                )}
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                  onClick={() => { setModalImage({ url: '', title: "Información de Seguimiento" }); setModalOpen(true); }}
                  title="Ver información de seguimiento">
                  <Eye className="h-3 w-3" />
                </Button>
                {onEditDocument && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onEditDocument('tracking_info')} title="Editar información">
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal para ver imágenes y tracking info */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{modalImage?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {modalImage && modalImage.title === "Información de Seguimiento" ? (
              <div className="w-full max-w-md space-y-4 p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">Número de seguimiento:</span>
                    <span className="text-sm font-mono">{trackingInfo?.trackingNumber || 'No disponible'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">Empresa de envío:</span>
                    <span className="text-sm">{(trackingInfo as any)?.shippingCompany || 'No especificada'}</span>
                  </div>
                  <div className="flex items-start justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">Link de seguimiento:</span>
                    <div className="text-right">
                      {trackingInfo?.trackingUrl ? (
                        <Button size="sm" variant="outline" onClick={() => window.open(trackingInfo.trackingUrl, '_blank')}>
                          <Eye className="h-3 w-3 mr-1" />
                          Abrir seguimiento
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No proporcionado</span>
                      )}
                    </div>
                  </div>
                  {(trackingInfo as any)?.notes && (
                    <div className="border-b pb-2">
                      <span className="text-sm text-muted-foreground">Notas:</span>
                      <p className="text-sm mt-1">{(trackingInfo as any).notes}</p>
                    </div>
                  )}
                  {trackingInfo?.timestamp && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Fecha de registro:</span>
                      <span className="text-sm">{new Date(trackingInfo.timestamp).toLocaleDateString('es-GT')}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : modalImage && (
              <img src={modalImage.url} alt={modalImage.title} className="max-w-full max-h-[70vh] object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UploadedDocumentsRegistry;
