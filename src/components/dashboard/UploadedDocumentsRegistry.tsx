import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Truck, CreditCard, Download, Eye, Calendar, Edit, Upload } from "lucide-react";
import { Package } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  // Helper function to view payment receipt
  const viewPaymentReceipt = async (paymentData: DocumentData) => {
    if (paymentData.filePath) {
      try {
        const { data, error } = await supabase.storage
          .from('payment-receipts')
          .createSignedUrl(paymentData.filePath, 3600);

        if (error) {
          toast({
            title: "Error",
            description: "No se pudo acceder al comprobante de pago",
            variant: "destructive",
          });
          return;
        }

        setModalImage({
          url: data.signedUrl,
          title: "Comprobante de pago"
        });
        setModalOpen(true);
      } catch (error) {
        console.error('Error viewing payment receipt:', error);
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar el archivo",
          variant: "destructive",
        });
      }
    }
  };

  // Helper function to view purchase confirmation
  const viewPurchaseConfirmation = async (confirmationData: DocumentData) => {
    if (confirmationData.filePath) {
      try {
        const { data, error } = await supabase.storage
          .from('payment-receipts')
          .createSignedUrl(confirmationData.filePath, 3600);

        if (error) {
          toast({
            title: "Error", 
            description: "No se pudo acceder al comprobante de compra",
            variant: "destructive",
          });
          return;
        }

        setModalImage({
          url: data.signedUrl,
          title: "Confirmación de compra"
        });
        setModalOpen(true);
      } catch (error) {
        console.error('Error viewing purchase confirmation:', error);
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar el archivo",
          variant: "destructive",
        });
      }
    }
  };

  // Parse document data safely
  const paymentReceipt = pkg.payment_receipt as DocumentData | null;
  const purchaseConfirmation = pkg.purchase_confirmation as DocumentData | null;
  const trackingInfo = pkg.tracking_info as DocumentData | null;

  // Count uploaded documents
  const uploadedCount = [
    paymentReceipt,
    purchaseConfirmation,
    trackingInfo
  ].filter(Boolean).length;

  if (uploadedCount === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span>Documentos Subidos</span>
          <Badge variant="secondary" className="text-xs">
            {uploadedCount}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          Documentos subidos para este pedido (confirmación de compra y tracking son independientes)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Payment Receipt */}
        {paymentReceipt && (
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs font-medium">Comprobante de pago</p>
                <p className="text-xs text-muted-foreground">
                  {paymentReceipt.filename || 'Comprobante subido'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {paymentReceipt.uploadedAt && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(paymentReceipt.uploadedAt).toLocaleDateString('es-GT')}
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => viewPaymentReceipt(paymentReceipt)}
                title="Ver documento"
              >
                <Eye className="h-3 w-3" />
              </Button>
              {onEditDocument && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => onEditDocument('payment_receipt')}
                  title="Editar documento"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Purchase Confirmation */}
        {purchaseConfirmation && (
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs font-medium">Confirmación de compra</p>
                <p className="text-xs text-muted-foreground">
                  {purchaseConfirmation.filename || 'Confirmación subida'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {purchaseConfirmation.uploadedAt && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(purchaseConfirmation.uploadedAt).toLocaleDateString('es-GT')}
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => viewPurchaseConfirmation(purchaseConfirmation)}
                title="Ver documento"
              >
                <Eye className="h-3 w-3" />
              </Button>
              {onEditDocument && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => onEditDocument('purchase_confirmation')}
                  title="Editar documento"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tracking Information */}
        {trackingInfo && (
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs font-medium">Información de envío</p>
                <p className="text-xs text-muted-foreground">
                  {trackingInfo.trackingNumber && `#${trackingInfo.trackingNumber}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {trackingInfo.timestamp && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(trackingInfo.timestamp).toLocaleDateString('es-GT')}
                </Badge>
              )}
              {trackingInfo.trackingUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => window.open(trackingInfo.trackingUrl, '_blank')}
                  title="Ver seguimiento"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              )}
              {onEditDocument && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => onEditDocument('tracking_info')}
                  title="Editar información"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Modal para ver imágenes */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{modalImage?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {modalImage && (
              <img 
                src={modalImage.url} 
                alt={modalImage.title}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UploadedDocumentsRegistry;