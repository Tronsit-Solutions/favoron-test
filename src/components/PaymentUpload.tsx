
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, DollarSign, Edit, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentUploadProps {
  packageId: string;
  onUpload: (paymentData: any) => void;
  currentPaymentReceipt?: any;
  isPaymentApproved?: boolean;
}

const PaymentUpload = ({ packageId, onUpload, currentPaymentReceipt, isPaymentApproved = false }: PaymentUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(!currentPaymentReceipt);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Formato no válido",
          description: "Solo se permiten imágenes (JPG, PNG) o archivos PDF.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      const paymentData = {
        filename: selectedFile.name,
        uploadedAt: new Date().toISOString(),
        type: 'payment_receipt'
      };
      
      onUpload(paymentData);
      
      toast({
        title: currentPaymentReceipt ? "¡Comprobante actualizado!" : "¡Comprobante subido!",
        description: currentPaymentReceipt ? "Tu comprobante de pago ha sido actualizado." : "Tu comprobante de pago ha sido enviado para revisión.",
      });
      
      setSelectedFile(null);
      setIsEditing(false);
    } else {
      // Allow submitting without file (optional)
      const paymentData = {
        filename: null,
        uploadedAt: new Date().toISOString(),
        type: 'payment_receipt'
      };
      
      onUpload(paymentData);
      
      toast({
        title: "¡Pago registrado!",
        description: "Tu pago ha sido registrado para revisión.",
      });
      
      setIsEditing(false);
    }
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-green-800">
          <DollarSign className="h-5 w-5" />
          <span>Pago a Favorón</span>
        </CardTitle>
        <CardDescription className="text-green-700">
          Realiza el pago a la cuenta bancaria de Favorón. Puedes subir una foto del comprobante aquí.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show current payment receipt if exists and not editing */}
        {currentPaymentReceipt && !isEditing && (
          <div className="bg-white/50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-800">Comprobante subido</p>
              </div>
              {!isPaymentApproved && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Reemplazar
                </Button>
              )}
            </div>
            <div className="text-xs text-green-600 space-y-1">
              <p>Archivo: {currentPaymentReceipt.filename || 'payment_receipt.pdf'}</p>
              <p>Subido el: {new Date(currentPaymentReceipt.uploadedAt).toLocaleDateString('es-GT')}</p>
              {isPaymentApproved && (
                <p className="text-blue-600 font-medium">✅ Pago aprobado por el administrador</p>
              )}
            </div>
          </div>
        )}

        {/* Upload/Edit form - show when editing or no current receipt */}
        {isEditing && (
          <>
            <div className="space-y-2">
              <Label htmlFor="paymentReceipt">
                {currentPaymentReceipt ? 'Nuevo comprobante de pago' : 'Comprobante de pago (opcional)'}
              </Label>
              <div className="border-2 border-dashed border-green-300 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-green-700 mb-2">
                  {currentPaymentReceipt ? 'Sube el nuevo comprobante de pago' : 'Sube tu comprobante de pago aquí'}
                </p>
                <Input
                  id="paymentReceipt"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileSelect}
                  className="mb-2"
                />
                {selectedFile && (
                  <p className="text-sm text-green-600 mb-2">
                    Archivo seleccionado: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleUpload} className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                {currentPaymentReceipt 
                  ? (selectedFile ? 'Actualizar Comprobante' : 'Confirmar sin archivo') 
                  : (selectedFile ? 'Subir Comprobante' : 'Confirmar Pago (sin comprobante)')
                }
              </Button>
              {currentPaymentReceipt && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedFile(null);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </>
        )}
        
        <div className="text-xs text-green-600 border-t border-green-200 pt-2">
          <p><strong>Información de pago:</strong></p>
          <p>• El administrador revisará tu pago</p>
          <p>• Una vez confirmado, recibirás la dirección del viajero</p>
          <p>• Formatos permitidos: JPG, PNG, PDF</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentUpload;
