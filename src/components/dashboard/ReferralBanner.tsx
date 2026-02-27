import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Gift, Copy, CheckCircle } from "lucide-react";
import { useReferrals } from "@/hooks/useReferrals";
import { useToast } from "@/hooks/use-toast";
import { APP_URL } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

const ReferralBanner = () => {
  const { referralCode, completedCount, loading } = useReferrals();
  const { toast } = useToast();
  const [discountAmount, setDiscountAmount] = useState(20);
  const [rewardAmount, setRewardAmount] = useState(20);
  const [copied, setCopied] = useState(false);

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
      setCopied(true);
      toast({ title: "¡Mensaje copiado!", description: "Compártelo con tus amigos" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Error", description: "No se pudo copiar", variant: "destructive" });
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card h-full shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-rose-500 to-pink-600" />
      
      <div className="p-4 sm:p-5 flex flex-col justify-between h-[calc(100%-6px)] gap-3">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
              <Gift className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground leading-tight">
                Invita amigos, gana Q{rewardAmount}
              </h3>
              {completedCount > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                  {completedCount} referido{completedCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tu amigo recibe <span className="font-semibold text-foreground">Q{discountAmount}</span> de descuento y tú ganas <span className="font-semibold text-foreground">Q{rewardAmount}</span>.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleCopy}
          className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold w-full sm:w-auto rounded-xl shadow-sm"
        >
          {copied ? (
            <>
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> ¡Copiado!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar link de referido
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReferralBanner;
