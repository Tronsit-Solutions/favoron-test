import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, Eye, X } from "lucide-react";

interface PaymentReceiptViewerProps {
  paymentReceipt?: {
    filename?: string;
    fileUrl?: string;
    uploadedAt?: string;
  };
  packageId: string;
  className?: string;
}

const PaymentReceiptViewer = ({ paymentReceipt, packageId, className }: PaymentReceiptViewerProps) => {
  const [showModal, setShowModal] = useState(false);

  if (!paymentReceipt?.fileUrl) {
    return (
      <Card className={`border-gray-200 bg-gray-50 ${className}`}>
        <CardContent className="p-4 text-center">
          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">Sin comprobante de pago</p>
        </CardContent>
      </Card>
    );
  }

  const isImage = paymentReceipt.filename?.match(/\.(jpg|jpeg|png|gif)$/i);
  const isPDF = paymentReceipt.filename?.match(/\.pdf$/i);

  const handleDownload = () => {
    if (paymentReceipt.fileUrl) {
      const link = document.createElement('a');
      link.href = paymentReceipt.fileUrl;
      link.download = paymentReceipt.filename || `comprobante_${packageId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-green-800">Comprobante de pago</p>
            </div>
          </div>
          
          <div className="text-xs text-green-600 space-y-1 mb-3">
            <p><strong>Archivo:</strong> {paymentReceipt.filename}</p>
            {paymentReceipt.uploadedAt && (
              <p><strong>Subido:</strong> {new Date(paymentReceipt.uploadedAt).toLocaleDateString('es-GT')}</p>
            )}
          </div>

          {/* Preview thumbnail for images */}
          {isImage && (
            <div className="mb-3">
              <img 
                src={paymentReceipt.fileUrl} 
                alt="Comprobante de pago"
                className="w-full h-32 object-cover rounded border cursor-pointer"
                onClick={() => setShowModal(true)}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowModal(true)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-1" />
              Descargar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal for full-size view */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Comprobante de pago - {paymentReceipt.filename}</span>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {isImage ? (
              <img 
                src={paymentReceipt.fileUrl} 
                alt="Comprobante de pago"
                className="w-full h-auto max-h-[70vh] object-contain rounded border"
              />
            ) : isPDF ? (
              <div className="bg-gray-100 p-8 text-center rounded">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-700 mb-4">Vista previa de PDF no disponible</p>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
            ) : (
              <div className="bg-gray-100 p-8 text-center rounded">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-700 mb-4">Vista previa no disponible</p>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar archivo
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentReceiptViewer;