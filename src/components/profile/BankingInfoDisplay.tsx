import { CreditCard, Building, Hash, Code, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BankingInfoDisplayProps {
  user: any;
}

const BankingInfoDisplay = ({ user }: BankingInfoDisplayProps) => {
  const bankingInfo = [
    {
      icon: CreditCard,
      label: "Nombre de cuenta",
      value: user.bank_account_holder || user.bankAccountHolder || 'No registrado'
    },
    {
      icon: Building,
      label: "Nombre del banco",
      value: user.bank_name || user.bankName || 'No registrado'
    },
    {
      icon: Hash,
      label: "Número de cuenta",
      value: user.bank_account_number || user.bankAccountNumber || 'No registrado'
    },
    {
      icon: Code,
      label: "Tipo de cuenta",
      value: user.bank_account_type || user.bankAccountType || 'No especificado'
    }
  ];

  const hasAnyBankingInfo = user.bank_account_holder || user.bankAccountHolder || 
                            user.bank_name || user.bankName || 
                            user.bank_account_number || user.bankAccountNumber;

  return (
    <div className="space-y-4">
      {hasAnyBankingInfo && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Esta información solo es visible para el equipo de Favorón y se utiliza exclusivamente para transferencias.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bankingInfo.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {!hasAnyBankingInfo && (
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