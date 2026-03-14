import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Users, Gift, CheckCircle, Clock } from "lucide-react";
import { useReferrals } from "@/hooks/useReferrals";
import { useToast } from "@/hooks/use-toast";
import { APP_URL } from "@/lib/constants";
import { copyToClipboard } from "@/lib/clipboard";
import { supabase } from "@/integrations/supabase/client";

const ReferralSection = () => {
  const { referralCode, referrals, balance, pendingCount, completedCount, loading } = useReferrals();
  const { toast } = useToast();
  const [discountAmount, setDiscountAmount] = useState(20);

  useEffect(() => {
    const fetchDiscount = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'referred_user_discount')
        .single();
      if (data?.value && typeof data.value === 'object' && 'amount' in (data.value as Record<string, unknown>)) {
        setDiscountAmount(Number((data.value as Record<string, unknown>).amount) || 20);
      }
    };
    fetchDiscount();
  }, []);

  if (loading || !referralCode) return null;

  const referralLink = `${APP_URL}/auth?ref=${referralCode}`;

  const shareMessage = `¡Únete a Favorón con mi link de referido y recibe un descuento de Q${discountAmount} en tu primer pedido! ${referralLink}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      toast({ title: "¡Mensaje copiado!", description: "Compártelo con tus amigos" });
    } catch {
      toast({ title: "Error", description: "No se pudo copiar", variant: "destructive" });
    }
  };



  return (
    <Card>
      <CardHeader className="pb-3 md:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-primary" />
          Programa de Referidos
        </CardTitle>
        <CardDescription className="text-sm">
          Invita amigos: ambos ganan cuando completen su primer pedido o viaje
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Balance */}
        <div className="rounded-lg bg-primary/10 p-4 text-center">
          <p className="text-sm text-muted-foreground">Saldo acumulado</p>
          <p className="text-2xl font-bold text-primary">Q{balance.toFixed(2)}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-md border p-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Referidos</p>
              <p className="text-sm font-semibold">{referrals.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border p-3">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Completados</p>
              <p className="text-sm font-semibold">{completedCount}</p>
            </div>
          </div>
        </div>

        {/* Referral Code & Link */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Tu código de referido</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono">
              {referralCode}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Share buttons */}
        <Button variant="outline" size="sm" onClick={handleCopy} className="w-full">
          <Copy className="h-4 w-4 mr-1" />
          Copiar link
        </Button>

        {/* Referral List */}
        {referrals.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Tus referidos</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {referrals.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between rounded-md border p-2">
                  <div className="flex items-center gap-2">
                    {ref.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{ref.referred_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(ref.created_at).toLocaleDateString('es-GT')}
                      </span>
                    </div>
                  </div>
                  <Badge variant={ref.status === 'completed' ? 'default' : 'secondary'}>
                    {ref.status === 'completed' ? `+Q${ref.reward_amount}` : 'Pendiente'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralSection;
