import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Crown } from 'lucide-react';

export interface FavoronCompanyFormValues {
  // Banking Information
  bank_name: string;
  account_holder: string;
  account_number: string;
  account_type: string;
  // Company Information
  company_name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state_department: string;
  postal_code: string;
  country: string;
  phone_number: string;
  email: string;
  website: string;
  // Cancellation penalty
  cancellation_penalty_amount: number;
}

interface Props {
  initialValues?: FavoronCompanyFormValues | null;
  onSubmit: (values: FavoronCompanyFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

export default function FavoronBankingInfoForm({ initialValues, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<FavoronCompanyFormValues>({
    // Banking Information
    bank_name: '',
    account_holder: '',
    account_number: '',
    account_type: 'Monetaria',
    // Company Information
    company_name: 'Favorón',
    address_line_1: '',
    address_line_2: '',
    city: 'Guatemala',
    state_department: 'Guatemala',
    postal_code: '',
    country: 'Guatemala',
    phone_number: '',
    email: 'info@favoron.app',
    website: 'favoron.app',
    // Cancellation penalty
    cancellation_penalty_amount: 5,
  });

  useEffect(() => {
    if (initialValues) {
      setValues({
        // Banking Information
        bank_name: initialValues.bank_name || '',
        account_holder: initialValues.account_holder || '',
        account_number: initialValues.account_number || '',
        account_type: initialValues.account_type || 'Monetaria',
        // Company Information
        company_name: initialValues.company_name || 'Favorón',
        address_line_1: initialValues.address_line_1 || '',
        address_line_2: initialValues.address_line_2 || '',
        city: initialValues.city || 'Guatemala',
        state_department: initialValues.state_department || 'Guatemala',
        postal_code: initialValues.postal_code || '',
        country: initialValues.country || 'Guatemala',
        phone_number: initialValues.phone_number || '',
        email: initialValues.email || 'info@favoron.app',
        website: initialValues.website || 'favoron.app',
        // Cancellation penalty
        cancellation_penalty_amount: initialValues.cancellation_penalty_amount ?? 5,
      });
    }
  }, [initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setValues((prev) => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(values);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Información de la empresa Favorón</CardTitle>
        <CardDescription>Información bancaria y de contacto de la empresa</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Información de la empresa</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nombre de la empresa</Label>
                <Input id="company_name" name="company_name" value={values.company_name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email de contacto</Label>
                <Input id="email" name="email" type="email" value={values.email} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Teléfono</Label>
                <Input id="phone_number" name="phone_number" value={values.phone_number} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Sitio web</Label>
                <Input id="website" name="website" value={values.website} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Dirección</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_line_1">Dirección línea 1</Label>
                <Input id="address_line_1" name="address_line_1" value={values.address_line_1} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_line_2">Dirección línea 2 (opcional)</Label>
                <Input id="address_line_2" name="address_line_2" value={values.address_line_2} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input id="city" name="city" value={values.city} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state_department">Departamento</Label>
                  <Input id="state_department" name="state_department" value={values.state_department} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Código postal</Label>
                  <Input id="postal_code" name="postal_code" value={values.postal_code} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input id="country" name="country" value={values.country} onChange={handleChange} required />
              </div>
            </div>
          </div>

          {/* Banking Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Información bancaria</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Cancellation Penalty Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Configuración de cancelaciones</h3>
            <div className="space-y-2">
              <Label htmlFor="cancellation_penalty_amount">Penalización por cancelación (Q)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Q</span>
                <Input
                  id="cancellation_penalty_amount"
                  name="cancellation_penalty_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.cancellation_penalty_amount}
                  onChange={handleChange}
                  className="w-24"
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Crown className="h-3 w-3 text-purple-500" />
                Los usuarios Prime están exentos de esta penalización.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit">Guardar información</Button>
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

// Backward compatibility export
export type FavoronBankFormValues = FavoronCompanyFormValues;
