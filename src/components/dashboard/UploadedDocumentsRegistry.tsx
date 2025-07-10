import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Truck, CreditCard, Download, Eye, Calendar } from "lucide-react";
import { Package } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UploadedDocumentsRegistryProps {
  pkg: Package;
  className?: string;
}

interface DocumentData {
  filename?: string;
  uploadedAt?: string;
  filePath?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  timestamp?: string;
}

const UploadedDocumentsRegistry = ({ pkg, className }: UploadedDocumentsRegistryProps) => {
  const { toast } = useToast();

  // Helper function to download payment receipt
  const downloadPaymentReceipt = async (paymentData: DocumentData) => {
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

        window.open(data.signedUrl, '_blank');
      } catch (error) {
        console.error('Error downloading payment receipt:', error);
        toast({
          title: "Error",
          description: "Ocurrió un error al descargar el archivo",
          variant: "destructive",
        });
      }
    }
  };

  // Helper function to download purchase confirmation
  const downloadPurchaseConfirmation = async (confirmationData: DocumentData) => {
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

        window.open(data.signedUrl, '_blank');
      } catch (error) {
        console.error('Error downloading purchase confirmation:', error);
        toast({
          title: "Error",
          description: "Ocurrió un error al descargar el archivo",
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
          Historial de documentos y comprobantes subidos
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
                onClick={() => downloadPaymentReceipt(paymentReceipt)}
              >
                <Eye className="h-3 w-3" />
              </Button>
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
                onClick={() => downloadPurchaseConfirmation(purchaseConfirmation)}
              >
                <Eye className="h-3 w-3" />
              </Button>
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
                >
                  <Eye className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UploadedDocumentsRegistry;