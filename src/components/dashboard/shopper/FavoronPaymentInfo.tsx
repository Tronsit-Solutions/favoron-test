import { CreditCard, Copy, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Package } from "@/types";

interface FavoronPaymentInfoProps {
  pkg: Package;
}

const FavoronPaymentInfo = ({ pkg }: FavoronPaymentInfoProps) => {
  const { toast } = useToast();

  const favoronBankingInfo = {
    accountHolder: "Favorón S.A.",
    bankName: "Banco Industrial",
    accountNumber: "123-456789-0",
    accountType: "Monetaria"
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${label} copiado al portapapeles`,
    });
  };

  if (pkg.status !== 'quote_accepted') {
    return null;
  }

  const quote = pkg.quote as any;
  const totalAmount = quote?.totalPrice ? parseFloat(quote.totalPrice) : 0;

  return (
    <Card className="border-success-border bg-success-muted">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-success">
          <CreditCard className="h-5 w-5" />
          Información de Pago - Favorón S.A.
        </CardTitle>
        <CardDescription>
          Transfiere el monto total a la cuenta de Favorón y sube tu comprobante de pago
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Titular de la cuenta:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{favoronBankingInfo.accountHolder}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(favoronBankingInfo.accountHolder, "Titular")}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Banco:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{favoronBankingInfo.bankName}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(favoronBankingInfo.bankName, "Banco")}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">No. de cuenta:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">{favoronBankingInfo.accountNumber}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(favoronBankingInfo.accountNumber, "Número de cuenta")}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Tipo de cuenta:</span>
              <span className="text-sm">{favoronBankingInfo.accountType}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-background rounded-lg border">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Monto a transferir:</p>
                <p className="text-2xl font-bold text-success">Q{totalAmount.toFixed(2)}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(totalAmount.toFixed(2), "Monto")}
                  className="mt-2"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar monto
                </Button>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-info-muted rounded-lg">
              <AlertCircle className="h-4 w-4 text-info mt-0.5" />
              <div className="text-xs text-info">
                <p className="font-medium">Importante:</p>
                <p>Después de realizar la transferencia, sube tu comprobante de pago en la sección "Documentos" abajo.</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FavoronPaymentInfo;