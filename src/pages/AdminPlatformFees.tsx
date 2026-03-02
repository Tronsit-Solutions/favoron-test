import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Percent, Truck, Crown, AlertTriangle, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { RequireAdmin } from '@/components/auth/RequireAdmin';
import { usePlatformFees, PlatformFees } from '@/hooks/usePlatformFees';

const AdminPlatformFees = () => {
  const navigate = useNavigate();
  const { fees, loading, saving, error, updateFees, refresh } = usePlatformFees();
  
  const [formData, setFormData] = useState<Omit<PlatformFees, 'id'> | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (fees) {
      setFormData({
        service_fee_rate_standard: fees.service_fee_rate_standard,
        service_fee_rate_prime: fees.service_fee_rate_prime,
        delivery_fee_guatemala_city: fees.delivery_fee_guatemala_city,
        delivery_fee_guatemala_department: fees.delivery_fee_guatemala_department,
        delivery_fee_outside_city: fees.delivery_fee_outside_city,
        prime_delivery_discount: fees.prime_delivery_discount,
        prime_membership_price: fees.prime_membership_price,
        cancellation_penalty_amount: fees.cancellation_penalty_amount,
        prime_penalty_exempt: fees.prime_penalty_exempt,
      });
      setHasChanges(false);
    }
  }, [fees]);

  const handleChange = (field: keyof Omit<PlatformFees, 'id'>, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => prev ? { ...prev, [field]: numValue } : null);
    setHasChanges(true);
  };

  const handleToggleChange = (field: keyof Omit<PlatformFees, 'id'>, value: boolean) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!formData) return;
    const success = await updateFees(formData);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    if (fees) {
      setFormData({
        service_fee_rate_standard: fees.service_fee_rate_standard,
        service_fee_rate_prime: fees.service_fee_rate_prime,
        delivery_fee_guatemala_city: fees.delivery_fee_guatemala_city,
        delivery_fee_guatemala_department: fees.delivery_fee_guatemala_department,
        delivery_fee_outside_city: fees.delivery_fee_outside_city,
        prime_delivery_discount: fees.prime_delivery_discount,
        prime_membership_price: fees.prime_membership_price,
        cancellation_penalty_amount: fees.cancellation_penalty_amount,
        prime_penalty_exempt: fees.prime_penalty_exempt,
      });
      setHasChanges(false);
    }
  };

  // Calculate preview values
  const previewBasePrice = 100;
  const standardServiceFee = formData ? previewBasePrice * formData.service_fee_rate_standard : 0;
  const primeServiceFee = formData ? previewBasePrice * formData.service_fee_rate_prime : 0;
  
  // Standard user totals
  const standardTotalCity = formData ? previewBasePrice + standardServiceFee + formData.delivery_fee_guatemala_city : 0;
  const standardTotalDept = formData ? previewBasePrice + standardServiceFee + formData.delivery_fee_guatemala_department : 0;
  const standardTotalOutside = formData ? previewBasePrice + standardServiceFee + formData.delivery_fee_outside_city : 0;
  
  // Prime user totals
  const primeTotalCity = formData ? previewBasePrice + primeServiceFee + 0 : 0;
  const primeTotalDept = formData ? previewBasePrice + primeServiceFee + Math.max(0, formData.delivery_fee_guatemala_department - formData.prime_delivery_discount) : 0;
  const primeTotalOutside = formData ? previewBasePrice + primeServiceFee + Math.max(0, formData.delivery_fee_outside_city - formData.prime_delivery_discount) : 0;

  return (
    <RequireAdmin>
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/control')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Tarifas de la Plataforma</h1>
            <p className="text-muted-foreground">Gestiona comisiones, envíos y penalizaciones</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
              <Button variant="outline" onClick={refresh} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : formData && (
          <div className="space-y-6">
            {/* Service Fees Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-primary" />
                  Comisión de Servicio
                </CardTitle>
                <CardDescription>
                  Porcentaje que Favorón cobra sobre el precio base del producto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="standard-fee">Usuarios Normales (%)</Label>
                    <div className="relative">
                      <Input
                        id="standard-fee"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={formData.service_fee_rate_standard}
                        onChange={(e) => handleChange('service_fee_rate_standard', e.target.value)}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {(formData.service_fee_rate_standard * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Ej: 0.40 = 40%</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="prime-fee" className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      Usuarios Prime (%)
                    </Label>
                    <div className="relative">
                      <Input
                        id="prime-fee"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={formData.service_fee_rate_prime}
                        onChange={(e) => handleChange('service_fee_rate_prime', e.target.value)}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {(formData.service_fee_rate_prime * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Ej: 0.20 = 20%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Fees Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Tarifas de Envío
                </CardTitle>
                <CardDescription>
                  Costos de entrega según ubicación y tipo de usuario (3 zonas)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery-city">Municipio de Guatemala (Q)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Q</span>
                      <Input
                        id="delivery-city"
                        type="number"
                        step="1"
                        min="0"
                        value={formData.delivery_fee_guatemala_city}
                        onChange={(e) => handleChange('delivery_fee_guatemala_city', e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Prime: Gratis</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="delivery-dept">Otros Municipios Dept. Guatemala (Q)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Q</span>
                      <Input
                        id="delivery-dept"
                        type="number"
                        step="1"
                        min="0"
                        value={formData.delivery_fee_guatemala_department}
                        onChange={(e) => handleChange('delivery_fee_guatemala_department', e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mixco, Villa Nueva, Petapa, etc. Prime: Q{Math.max(0, formData.delivery_fee_guatemala_department - formData.prime_delivery_discount)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery-outside">Fuera del Depto. Guatemala (Q)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Q</span>
                      <Input
                        id="delivery-outside"
                        type="number"
                        step="1"
                        min="0"
                        value={formData.delivery_fee_outside_city}
                        onChange={(e) => handleChange('delivery_fee_outside_city', e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Prime: Q{Math.max(0, formData.delivery_fee_outside_city - formData.prime_delivery_discount)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="prime-discount" className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    Descuento Prime en Envío (Q)
                  </Label>
                  <div className="relative w-full md:w-1/3">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Q</span>
                    <Input
                      id="prime-discount"
                      type="number"
                      step="1"
                      min="0"
                      value={formData.prime_delivery_discount}
                      onChange={(e) => handleChange('prime_delivery_discount', e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Descuento aplicado a envíos fuera del Municipio de Guatemala
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Penalties & Memberships Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Penalizaciones y Membresías
                </CardTitle>
                <CardDescription>
                  Otros cargos y precios de la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="penalty" className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Penalización por Cancelación (Q)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Q</span>
                      <Input
                        id="penalty"
                        type="number"
                        step="1"
                        min="0"
                        value={formData.cancellation_penalty_amount}
                        onChange={(e) => handleChange('cancellation_penalty_amount', e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="prime-price" className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      Precio Membresía Prime (Q/año)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Q</span>
                      <Input
                        id="prime-price"
                        type="number"
                        step="1"
                        min="0"
                        value={formData.prime_membership_price}
                        onChange={(e) => handleChange('prime_membership_price', e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="prime-exempt" className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      Prime exento de penalización
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Los usuarios Prime no pagan penalización por cancelar productos
                    </p>
                  </div>
                  <Switch
                    id="prime-exempt"
                    checked={formData.prime_penalty_exempt}
                    onCheckedChange={(value) => handleToggleChange('prime_penalty_exempt', value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview Section */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Vista Previa</CardTitle>
                <CardDescription>
                  Ejemplo con producto de Q{previewBasePrice}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Standard User */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      👤 Usuario Normal
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio base:</span>
                        <span>Q{previewBasePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Comisión ({(formData.service_fee_rate_standard * 100).toFixed(0)}%):</span>
                        <span>Q{standardServiceFee.toFixed(2)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-muted-foreground">
                        <span>+ Envío Municipio Guate:</span>
                        <span className="font-medium text-foreground">Q{standardTotalCity.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>+ Envío Depto. Guate:</span>
                        <span className="font-medium text-foreground">Q{standardTotalDept.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>+ Envío Fuera Depto:</span>
                        <span className="font-medium text-foreground">Q{standardTotalOutside.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Prime User */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      Usuario Prime
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio base:</span>
                        <span>Q{previewBasePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Comisión ({(formData.service_fee_rate_prime * 100).toFixed(0)}%):</span>
                        <span className="text-green-600">Q{primeServiceFee.toFixed(2)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-muted-foreground">
                        <span>+ Envío Municipio Guate (gratis):</span>
                        <span className="font-medium text-green-600">Q{primeTotalCity.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>+ Envío Depto. Guate:</span>
                        <span className="font-medium text-foreground">Q{primeTotalDept.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>+ Envío Fuera Depto:</span>
                        <span className="font-medium text-foreground">Q{primeTotalOutside.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 sticky bottom-4 bg-background/95 backdrop-blur-sm py-4 px-4 -mx-4 border-t">
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={!hasChanges || saving}
              >
                Descartar cambios
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!hasChanges || saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </RequireAdmin>
  );
};

export default AdminPlatformFees;
