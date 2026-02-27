import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Copy, CheckCircle } from "lucide-react";
import { useReferrals } from "@/hooks/useReferrals";
import { useToast } from "@/hooks/use-toast";
import { APP_URL } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

const ReferralBanner = () => {
  const { referralCode, referrals, completedCount, loading } = useReferrals();
  const { toast } = useToast();
  const [discountAmount, setDiscountAmount] = useState(20);
  const [rewardAmount, setRewardAmount] = useState(20);

  useEffect(() => {
    const fetchSettings = async () => {
      const [discountRes, rewardRes] = await Promise.all([
        supabase.from('app_settings').select('value').eq('key', 'referred_user_discount').single(),
        supabase.from('app_settings').select('value').eq('key', 'referral_reward_amount').single(),
      ]);
      if (discountRes.data?.value && typeof discountRes.data.value === 'object' && 'amount' in (discountRes.data.value as Record<string, unknown>)) {
        setDiscountAmount(Number((discountRes.data.value as Record<string, unknown>).amount) || 20);
      }
      if (rewardRes.data?.value && typeof rewardRes.data.value === 'object' && 'amount' in (rewardRes.data.value as Record<string, unknown>)) {
        setRewardAmount(Number((rewardRes.data.value as Record<string, unknown>).amount) || 20);
      }
    };
    fetchSettings();
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
    <Card className="border bg-gradient-to-r from-primary/5 to-purple-50 dark:from-primary/10 dark:to-purple-950/20">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Text section */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-base">Invita amigos y gana recompensas</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Comparte tu código y ambos ganan: <strong>Q{rewardAmount}</strong> para ti, <strong>Q{discountAmount}</strong> de descuento para tu amigo
            </p>
            {completedCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                {completedCount} referido{completedCount > 1 ? 's' : ''} completado{completedCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Action */}
          <div className="sm:min-w-[160px]">
            <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs w-full">
              <Copy className="h-3 w-3 mr-1" />
              Copiar link
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralBanner;
