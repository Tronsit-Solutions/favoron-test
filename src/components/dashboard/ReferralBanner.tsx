import { useState, useEffect } from "react";
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
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 h-full shadow-lg">
      {/* Decorative handshake image */}
      <img
        src="/images/handshake.jpg"
        alt=""
        className="absolute right-0 top-0 h-full w-1/3 object-cover opacity-15 hidden sm:block"
      />
      <div className="relative z-10 p-4 sm:p-6 flex flex-col justify-between h-full gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-white" />
            <h3 className="font-bold text-base text-white">Invita amigos y gana recompensas</h3>
          </div>
          <p className="text-sm text-white/90">
            Comparte tu código y ambos ganan:{" "}
            <span className="inline-block bg-yellow-300 text-yellow-900 font-bold px-2 py-0.5 rounded-full text-xs">Q{rewardAmount}</span>{" "}
            para ti,{" "}
            <span className="inline-block bg-white/90 text-purple-700 font-bold px-2 py-0.5 rounded-full text-xs">Q{discountAmount}</span>{" "}
            de descuento para tu amigo
          </p>
          {completedCount > 0 && (
            <Badge className="bg-white/20 text-white border-white/30 text-xs backdrop-blur-sm">
              <CheckCircle className="h-3 w-3 mr-1" />
              {completedCount} referido{completedCount > 1 ? 's' : ''} completado{completedCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div>
          <Button
            size="sm"
            onClick={handleCopy}
            className="bg-white text-purple-700 hover:bg-white/90 text-xs font-semibold w-full sm:w-auto shadow-md"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copiar link de referido
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReferralBanner;
