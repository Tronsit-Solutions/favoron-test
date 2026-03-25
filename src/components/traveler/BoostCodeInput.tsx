import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Rocket, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BoostCodeInputProps {
  tripId: string;
  travelerId: string;
  existingBoost?: number;
  onBoostApplied?: (amount: number) => void;
}

const BoostCodeInput = ({ tripId, travelerId, existingBoost, onBoostApplied }: BoostCodeInputProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [appliedBoost, setAppliedBoost] = useState<number | null>(existingBoost && existingBoost > 0 ? existingBoost : null);
  const { toast } = useToast();

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('validate_boost_code', {
        _code: code.trim().toUpperCase(),
        _trip_id: tripId,
        _traveler_id: travelerId,
      });

      if (error) throw error;

      const result = data as any;
      if (result.valid) {
        const boostAmt = Number(result.boost_amount);
        setAppliedBoost(boostAmt);
        setCode("");
        if (boostAmt > 0) {
          toast({
            title: "🚀 Boost aplicado",
            description: `+Q${boostAmt.toFixed(2)} agregados a tu pago`,
          });
        } else {
          toast({
            title: "🚀 Código de boost aplicado",
            description: "El monto se calculará al entregar paquetes",
          });
        }
        onBoostApplied?.(boostAmt);
      } else {
        toast({
          title: "Código inválido",
          description: result.error || "No se pudo aplicar el código",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error applying boost code:', error);
      toast({
        title: "Error",
        description: "No se pudo validar el código de boost",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (appliedBoost !== null && appliedBoost >= 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50 text-green-700">
        <Check className="h-4 w-4" />
        <span className="text-sm font-medium">
          {appliedBoost > 0
            ? `Tip Boost activo: +Q${appliedBoost.toFixed(2)}`
            : "Código de boost aplicado — se calculará al entregar paquetes"}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-1.5">
        <Rocket className="h-4 w-4 text-primary" />
        Código de Tip Boost
      </label>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Ej: BOOST10"
          className="font-mono"
          disabled={loading}
        />
        <Button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          size="sm"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Ingresa un código de boost para aumentar tu pago en este viaje
      </p>
    </div>
  );
};

export default BoostCodeInput;
