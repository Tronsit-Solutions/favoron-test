import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Building, Hash, Landmark, Shield, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFinancialData } from '@/hooks/useFinancialData';

const BankingInfoDisplay = () => {
  const { financialData, loading } = useFinancialData();

  const bankingDetails = [
    {
      icon: CreditCard,
      label: "Nombre de cuenta",
      value: financialData?.bank_account_holder
    },
    {
      icon: Building,
      label: "Banco",
      value: financialData?.bank_name
    },
    {
      icon: Hash,
      label: "Número de cuenta",
      value: financialData?.bank_account_number
    },
    {
      icon: Landmark,
      label: "Tipo de cuenta",
      value: financialData?.bank_account_type
    }
  ];

  const hasBankingInfo = bankingDetails.some(detail => detail.value);
  
  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {hasBankingInfo && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Esta información solo es visible para el equipo de Favorón y se utiliza exclusivamente para transferencias.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bankingDetails.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.value || 'No registrado'}</p>
            </div>
          </div>
        ))}
      </div>

      {!hasBankingInfo && (
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            No has agregado información bancaria aún
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Agrega tu información bancaria para recibir pagos por los Favorones completados
          </p>
        </div>
      )}
    </div>
  );
};

export default BankingInfoDisplay;