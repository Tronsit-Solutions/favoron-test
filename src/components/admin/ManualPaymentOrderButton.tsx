import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { createManualPaymentOrderForRodrigo } from '@/utils/manualPaymentOrderCreator';

export const ManualPaymentOrderButton = () => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateOrder = async () => {
    if (!confirm('¿Crear orden de pago manual para Rodrigo Zibara (viaje 0e661163) por Q140?')) {
      return;
    }

    setIsCreating(true);
    try {
      const result = await createManualPaymentOrderForRodrigo();
      
      if (result.success) {
        toast.success('Orden de pago creada', {
          description: result.message
        });
      } else {
        toast.error('Error al crear orden de pago', {
          description: result.error
        });
      }
    } catch (error) {
      toast.error('Error al crear orden de pago', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={handleCreateOrder}
      disabled={isCreating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <DollarSign className="h-4 w-4" />
      {isCreating ? 'Creando...' : 'Crear Orden Pago Rodrigo'}
    </Button>
  );
};
