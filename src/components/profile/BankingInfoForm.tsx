import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Building, Save, Shield } from "lucide-react";
import { useFinancialData, FinancialData } from "@/hooks/useFinancialData";
import { useState, useEffect } from "react";

interface BankingInfoFormProps {
  onSave?: () => void;
}

const BankingInfoForm = ({ onSave }: BankingInfoFormProps) => {
  const { financialData, updateFinancialData, loading } = useFinancialData();
  const [formData, setFormData] = useState({
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
    bank_account_type: 'monetaria'
  });

  // Initialize form data when financial data loads
  useEffect(() => {
    if (financialData) {
      setFormData({
        bank_name: financialData.bank_name || '',
        bank_account_number: financialData.bank_account_number || '',
        bank_account_holder: financialData.bank_account_holder || '',
        bank_account_type: financialData.bank_account_type || 'monetaria'
      });
    }
  }, [financialData]);

  const handleSave = async () => {
    try {
      await updateFinancialData(formData);
      onSave?.();
    } catch (error) {
      console.error('Error saving financial data:', error);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  return (
    <>
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Esta información solo será visible para el equipo de Favorón y se utilizará exclusivamente para transferencias cuando completes Favorones.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bankAccountHolder">Nombre de cuenta</Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="bankAccountHolder"
              value={formData.bank_account_holder}
              onChange={(e) => updateField('bank_account_holder', e.target.value)}
              placeholder="Nombre completo del titular"
              className="pl-10"
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankName">Nombre del banco</Label>
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="bankName"
              value={formData.bank_name}
              onChange={(e) => updateField('bank_name', e.target.value)}
              placeholder="Ej: Banco Industrial"
              className="pl-10"
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankAccountNumber">Número de cuenta</Label>
          <Input
            id="bankAccountNumber"
            value={formData.bank_account_number}
            onChange={(e) => updateField('bank_account_number', e.target.value)}
            placeholder="Número de cuenta bancaria"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankAccountType">Tipo de cuenta</Label>
          <Select
            value={formData.bank_account_type}
            onValueChange={(value) => updateField('bank_account_type', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tipo de cuenta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monetaria">Monetaria</SelectItem>
              <SelectItem value="ahorros">Ahorros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} className="w-full" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Guardando...' : 'Guardar Información Bancaria'}
        </Button>
      </div>
    </>
  );
};

export default BankingInfoForm;