import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Building2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentMethod = 'bank_transfer' | 'card';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export default function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  disabled = false
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">
        Selecciona tu método de pago:
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Bank Transfer Option */}
        <button
          type="button"
          onClick={() => onMethodChange('bank_transfer')}
          disabled={disabled}
          className={cn(
            'relative p-4 rounded-lg border-2 transition-all text-left',
            'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
            selectedMethod === 'bank_transfer'
              ? 'border-primary bg-primary/5'
              : 'border-border bg-card hover:bg-muted/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              'p-2 rounded-full',
              selectedMethod === 'bank_transfer'
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            )}>
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Transferencia Bancaria</span>
                {selectedMethod === 'bank_transfer' && (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Deposita en nuestra cuenta y sube tu comprobante
              </p>
            </div>
          </div>
        </button>

        {/* Card Payment Option */}
        <button
          type="button"
          onClick={() => onMethodChange('card')}
          disabled={disabled}
          className={cn(
            'relative p-4 rounded-lg border-2 transition-all text-left',
            'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
            selectedMethod === 'card'
              ? 'border-primary bg-primary/5'
              : 'border-border bg-card hover:bg-muted/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              'p-2 rounded-full',
              selectedMethod === 'card'
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            )}>
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Tarjeta de Crédito/Débito</span>
                {selectedMethod === 'card' && (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Paga de forma segura con Visa, Mastercard o American Express
              </p>
            </div>
          </div>
          
          {/* Card logos */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <img 
                src="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/flags/4x3/xx.svg" 
                alt="Visa" 
                className="h-4 w-auto opacity-70"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <span className="text-[10px] text-muted-foreground font-medium">VISA</span>
              <span className="text-[10px] text-muted-foreground font-medium">MC</span>
              <span className="text-[10px] text-muted-foreground font-medium">AMEX</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
