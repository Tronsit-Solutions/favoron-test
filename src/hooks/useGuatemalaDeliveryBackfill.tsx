import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGuatemalaDeliveryBackfill = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const executeBackfill = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('fix-guatemala-delivery-fees');

      if (error) {
        console.error('Error executing backfill:', error);
        toast({
          title: "Error",
          description: "No se pudo ejecutar la corrección de tarifas",
          variant: "destructive",
        });
        return;
      }

      setResult(data);
      
      if (data.success) {
        toast({
          title: "Backfill Completado",
          description: `${data.stats.updated} paquetes actualizados correctamente`,
        });
      } else {
        toast({
          title: "Advertencia",
          description: "El backfill terminó con advertencias",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error calling backfill function:', error);
      toast({
        title: "Error",
        description: "Error al ejecutar la función",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    executeBackfill,
    loading,
    result
  };
};
