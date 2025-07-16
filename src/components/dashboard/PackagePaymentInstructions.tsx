import React from "react";

interface PackagePaymentInstructionsProps {
  quote: any;
}

export const PackagePaymentInstructions = ({ quote }: PackagePaymentInstructionsProps) => {
  const amount = quote && typeof quote === 'object' ? parseFloat(quote.totalPrice || '0').toFixed(2) : '0.00';

  return (
    <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold text-primary mb-2">💵 Instrucciones de pago</p>
        <p className="text-xs text-muted-foreground mb-3">
          Por favor realiza el pago correspondiente a tu cotización a la siguiente cuenta:
        </p>
      </div>
      
      <div className="bg-background/80 rounded-md p-3 border border-border mb-4">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">Nombre de la cuenta:</span>
            <span className="text-black font-semibold">Favorón S.A.</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Número de cuenta:</span>
            <span className="text-black font-semibold font-mono">84V050N</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Banco:</span>
            <span className="text-black font-semibold">Banco Industrial</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 mt-2">
            <span className="font-medium">Monto:</span>
            <span className="text-black font-bold text-lg">Q{amount}</span>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Una vez realizado el pago, sube tu comprobante para continuar con el proceso.
      </p>
    </div>
  );
};