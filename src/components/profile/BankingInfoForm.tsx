import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Building, Save, Shield } from "lucide-react";

interface BankingInfoFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSave: () => void;
}

const BankingInfoForm = ({ formData, setFormData, onSave }: BankingInfoFormProps) => {
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
              value={formData.bankAccountHolder || ''}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, bankAccountHolder: e.target.value }))}
              placeholder="Nombre completo del titular"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankName">Nombre del banco</Label>
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="bankName"
              value={formData.bankName || ''}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, bankName: e.target.value }))}
              placeholder="Ej: Banco Industrial"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankAccountNumber">Número de cuenta</Label>
          <Input
            id="bankAccountNumber"
            value={formData.bankAccountNumber || ''}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, bankAccountNumber: e.target.value }))}
            placeholder="Número de cuenta bancaria"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankAccountType">Tipo de cuenta</Label>
          <Select
            value={formData.bankAccountType || ''}
            onValueChange={(value) => setFormData((prev: any) => ({ ...prev, bankAccountType: value }))}
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

        <Button onClick={onSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Guardar Información Bancaria
        </Button>
      </div>
    </>
  );
};

export default BankingInfoForm;