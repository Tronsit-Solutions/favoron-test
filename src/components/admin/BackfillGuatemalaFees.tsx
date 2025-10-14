import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export const BackfillGuatemalaFees = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const executeBackfill = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('fix-guatemala-delivery-fees', {
        body: {}
      });

      if (error) throw error;

      setResult(data);
      
      if (data.success) {
        toast.success(`Backfill completado: ${data.stats.updated} paquetes actualizados`);
      } else {
        toast.error('Error en el backfill');
      }
    } catch (error: any) {
      console.error('Error executing backfill:', error);
      toast.error(error.message || 'Error al ejecutar el backfill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Corrección de Tarifas de Envío - Guatemala City</h3>
        <p className="text-sm text-muted-foreground">
          Este backfill corregirá las tarifas de envío a domicilio en Guatemala City de Q35/Q60 a Q25.
        </p>
      </div>

      <Button 
        onClick={executeBackfill} 
        disabled={loading}
        className="w-full"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Ejecutar Backfill
      </Button>

      {result && (
        <div className="mt-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-start gap-2 mb-2">
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium">{result.message}</p>
              {result.stats && (
                <div className="mt-2 text-sm space-y-1">
                  <p>📦 Total encontrados: {result.stats.total_found}</p>
                  <p>✅ Actualizados: {result.stats.updated}</p>
                  <p>⏭️ Omitidos (ya correctos): {result.stats.skipped}</p>
                  <p>❌ Errores: {result.stats.errors}</p>
                </div>
              )}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2 text-sm text-red-600">
                  <p className="font-medium">Errores:</p>
                  {result.errors.map((err: any, idx: number) => (
                    <p key={idx}>• Package {err.package_id}: {err.error}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
