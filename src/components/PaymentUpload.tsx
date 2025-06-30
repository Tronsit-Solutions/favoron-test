
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentUploadProps {
  packageId: number;
  onUpload: (paymentData: any) => void;
}

const PaymentUpload = ({ packageId, onUpload }: PaymentUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
        title: "¡Comprobante subido!",
        description: "Tu comprobante de pago ha sido enviado para revisión.",
      });
      
      setSelectedFile(null);
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
          Ahora debes hacer el pago a la cuenta bancaria de Favorón. Puedes subir una foto del comprobante en este mismo formulario.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="paymentReceipt">Comprobante de pago (opcional)</Label>
          <div className="border-2 border-dashed border-green-300 rounded-lg p-4 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-sm text-green-700 mb-2">
              Sube tu comprobante de pago aquí
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
        
        {selectedFile && (
          <Button onClick={handleUpload} className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Subir Comprobante
          </Button>
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
