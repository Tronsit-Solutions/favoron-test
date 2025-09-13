import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileImage, X, CreditCard, Copy, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavoronBankingInfo } from "@/hooks/useFavoronBankingInfo";
import { useAuth } from "@/hooks/useAuth";

interface PrimePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PrimePaymentModal = ({ isOpen, onClose, onSuccess }: PrimePaymentModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { account: favoronAccount } = useFavoronBankingInfo();
  const { user } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: "Archivo no válido",
          description: "Solo se permiten imágenes y archivos PDF",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Archivo muy grande",
          description: "El archivo no puede ser mayor a 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedFile || !user || !favoronAccount) {
      toast({
        title: "Error",
        description: "Debes seleccionar un comprobante de pago",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload payment receipt to storage
      const fileName = `prime_payment_receipt_${user.id}_${Date.now()}.${selectedFile.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Create Prime membership payment order
      const { data: paymentOrder, error: paymentError } = await supabase
        .from('payment_orders')
        .insert({
          traveler_id: user.id,
          trip_id: '00000000-0000-0000-0000-000000000000', // Dummy trip ID for Prime payments
          amount: 200,
          payment_type: 'prime_membership',
          bank_name: favoronAccount.bank_name,
          bank_account_holder: favoronAccount.account_holder,
          bank_account_number: favoronAccount.account_number,
          bank_account_type: favoronAccount.account_type,
          notes: `Pago de membresía Favorón Prime - 1 año. Comprobante: ${fileName}`,
          historical_packages: [],
          status: 'pending',
          receipt_url: fileName,
          receipt_filename: selectedFile.name
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      toast({
        title: "✨ Comprobante enviado exitosamente",
        description: "Tu solicitud de membresía Prime está siendo procesada por un administrador.",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error submitting Prime payment:', error);
      toast({
        title: "Error",
        description: error.message || "Error al enviar el comprobante de pago",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${label} copiado al portapapeles`,
    });
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-purple-700">Pagar Membresía Prime</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Information */}
          {favoronAccount && (
            <Card className="border-purple-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-purple-700 mb-3">
                  Información para transferencia bancaria
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                    <div>
                      <span className="text-sm text-purple-600">Banco:</span>
                      <p className="font-medium">{favoronAccount.bank_name}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(favoronAccount.bank_name, "Banco")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                    <div>
                      <span className="text-sm text-purple-600">Titular:</span>
                      <p className="font-medium">{favoronAccount.account_holder}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(favoronAccount.account_holder, "Titular")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                    <div>
                      <span className="text-sm text-purple-600">No. de Cuenta:</span>
                      <p className="font-medium font-mono">{favoronAccount.account_number}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(favoronAccount.account_number, "Número de cuenta")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="text-center p-3 bg-purple-100 rounded-lg">
                    <p className="text-lg font-bold text-purple-800">Monto: Q200.00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Section */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Subir comprobante de pago</h4>
              
              {!selectedFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="payment-receipt"
                  />
                  <label
                    htmlFor="payment-receipt"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Haz clic para subir tu comprobante
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG o PDF (máx. 10MB)
                    </p>
                  </label>
                </div>
              ) : (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileImage className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800">{selectedFile.name}</p>
                        <p className="text-sm text-green-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={removeFile}
                      className="text-green-600 hover:text-green-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-semibold text-blue-800 mb-2">Instrucciones:</h5>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Realiza la transferencia bancaria por Q200.00</li>
              <li>Toma una foto clara del comprobante</li>
              <li>Sube el comprobante usando el botón de arriba</li>
              <li>Confirma tu solicitud</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleSubmitPayment}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Enviar Solicitud
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};