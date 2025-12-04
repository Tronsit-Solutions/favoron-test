import { Card, CardContent } from '@/components/ui/card';
import { Crown } from 'lucide-react';

interface Props {
  companyInfo: {
    // Banking Information
    bank_name?: string;
    account_holder?: string;
    account_number?: string;
    account_type?: string;
    // Company Information
    company_name?: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state_department?: string;
    postal_code?: string;
    country?: string;
    phone_number?: string;
    email?: string;
    website?: string;
    // Cancellation penalty
    cancellation_penalty_amount?: number;
  } | null;
}

export default function FavoronBankingInfoDisplay({ companyInfo }: Props) {
  return (
    <Card>
      <CardContent className="space-y-6 pt-4">
        {/* Company Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Información de la empresa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Empresa:</span>{' '}
              <span className="font-medium text-foreground">{companyInfo?.company_name || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>{' '}
              <span className="font-medium text-foreground">{companyInfo?.email || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Teléfono:</span>{' '}
              <span className="font-medium text-foreground">{companyInfo?.phone_number || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Sitio web:</span>{' '}
              <span className="font-medium text-foreground">{companyInfo?.website || '—'}</span>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Dirección</h3>
          <div className="grid grid-cols-1 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Dirección:</span>{' '}
              <span className="font-medium text-foreground">
                {companyInfo?.address_line_1 ? (
                  <>
                    {companyInfo.address_line_1}
                    {companyInfo.address_line_2 && <>, {companyInfo.address_line_2}</>}
                  </>
                ) : '—'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2">
              <div>
                <span className="text-muted-foreground">Ciudad:</span>{' '}
                <span className="font-medium text-foreground">{companyInfo?.city || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Departamento:</span>{' '}
                <span className="font-medium text-foreground">{companyInfo?.state_department || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Código postal:</span>{' '}
                <span className="font-medium text-foreground">{companyInfo?.postal_code || '—'}</span>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">País:</span>{' '}
              <span className="font-medium text-foreground">{companyInfo?.country || '—'}</span>
            </div>
          </div>
        </div>

        {/* Banking Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Información bancaria</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Banco:</span>{' '}
              <span className="font-medium text-foreground">{companyInfo?.bank_name || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Titular:</span>{' '}
              <span className="font-medium text-foreground">{companyInfo?.account_holder || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cuenta:</span>{' '}
              <span className="font-medium text-foreground font-mono">
                {companyInfo?.account_number || '—'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Tipo:</span>{' '}
              <span className="font-medium text-foreground">{companyInfo?.account_type || '—'}</span>
            </div>
          </div>
        </div>

        {/* Cancellation Penalty */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Configuración de cancelaciones</h3>
          <div className="text-sm">
            <div>
              <span className="text-muted-foreground">Penalización por cancelación:</span>{' '}
              <span className="font-medium text-foreground">
                Q{(companyInfo?.cancellation_penalty_amount ?? 5).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Crown className="h-3 w-3 text-purple-500" />
              Los usuarios Prime están exentos de esta penalización.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
