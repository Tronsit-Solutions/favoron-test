import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface FavoronBankFormValues {
  bank_name: string;
  account_holder: string;
  account_number: string;
  account_type: string;
}

interface Props {
  initialValues?: FavoronBankFormValues | null;
  onSubmit: (values: FavoronBankFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

export default function FavoronBankingInfoForm({ initialValues, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<FavoronBankFormValues>({
    bank_name: '',
    account_holder: '',
    account_number: '',
    account_type: 'Monetaria',
  });

  useEffect(() => {
    if (initialValues) {
      setValues({
        bank_name: initialValues.bank_name || '',
        account_holder: initialValues.account_holder || '',
        account_number: initialValues.account_number || '',
        account_type: initialValues.account_type || 'Monetaria',
      });
    }
  }, [initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(values);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Editar información bancaria de Favorón</CardTitle>
        <CardDescription>Estos datos se muestran a los shoppers para transferencias</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bank_name">Banco</Label>
            <Input id="bank_name" name="bank_name" value={values.bank_name} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_holder">Titular</Label>
            <Input id="account_holder" name="account_holder" value={values.account_holder} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_number">Número de cuenta</Label>
            <Input id="account_number" name="account_number" value={values.account_number} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_type">Tipo de cuenta</Label>
            <Input id="account_type" name="account_type" value={values.account_type} onChange={handleChange} required />
          </div>

          <div className="sm:col-span-2 flex gap-2 pt-2">
            <Button type="submit">Guardar</Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
