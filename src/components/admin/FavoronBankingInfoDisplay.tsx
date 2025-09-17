import { Card, CardContent } from '@/components/ui/card';
import { maskAccountNumber, auditFinancialDataAccess } from '@/lib/financialSecurity';
import { useEffect } from 'react';

interface Props {
  account: {
    bank_name?: string;
    account_holder?: string;
    account_number?: string;
    account_type?: string;
  } | null;
}

export default function FavoronBankingInfoDisplay({ account }: Props) {
  // Audit financial data access for security monitoring
  useEffect(() => {
    if (account?.account_number) {
      auditFinancialDataAccess(
        'system', // This is system/admin viewing
        'view',
        'banking_info',
        true // Data is masked
      );
    }
  }, [account?.account_number]);

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Banco:</span>{' '}
            <span className="font-medium text-foreground">{account?.bank_name || '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Titular:</span>{' '}
            <span className="font-medium text-foreground">{account?.account_holder || '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Cuenta:</span>{' '}
            <span className="font-medium text-foreground font-mono">
              {account?.account_number ? maskAccountNumber(account.account_number) : '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Tipo:</span>{' '}
            <span className="font-medium text-foreground">{account?.account_type || '—'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
