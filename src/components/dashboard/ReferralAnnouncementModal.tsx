import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Copy, CheckCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ReferralAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReferralAnnouncementModal = ({ isOpen, onClose }: ReferralAnnouncementModalProps) => {
  const [rewardAmount, setRewardAmount] = useState(30);
  const [discountAmount, setDiscountAmount] = useState(15);
  const [copied, setCopied] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const referralCode = (profile as any)?.referral_code;
  const referralLink = referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : "";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("key, value")
          .in("key", ["referral_reward_amount", "referral_discount_amount"]);
        if (data) {
          data.forEach((s) => {
            if (s.key === "referral_reward_amount") setRewardAmount(Number(s.value) || 30);
            if (s.key === "referral_discount_amount") setDiscountAmount(Number(s.value) || 15);
          });
        }
      } catch {}
    };
    if (isOpen) fetchSettings();
  }, [isOpen]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: "¡Link copiado!", description: "Compártelo con tus amigos" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Error", description: "No se pudo copiar", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={cn(
        "p-0 gap-0 overflow-hidden border-0 [&>button]:hidden",
        isMobile
          ? "fixed inset-x-0 bottom-0 top-auto w-full max-w-none rounded-t-3xl rounded-b-none translate-x-0 translate-y-0 left-0"
          : "max-w-md rounded-2xl"
      )}>
        <div className={cn("flex flex-col", isMobile && "max-h-[85vh]")}>
          {/* Hero illustration area */}
          <div className="relative h-52 sm:h-56 bg-gradient-to-br from-rose-100 via-pink-50 to-orange-50 flex items-center justify-center overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-rose-200/40" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-orange-200/30" />
            <div className="absolute top-8 left-8 w-16 h-16 rounded-full bg-pink-200/50" />
            
            {/* Gift icon */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-200">
                <Gift className="h-10 w-10 text-white" />
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm">
                <span className="text-sm font-semibold text-rose-600">Programa de Referidos</span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-foreground/10 hover:bg-foreground/20 backdrop-blur-sm flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4 text-foreground/70" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 bg-background">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                Gana Q{rewardAmount} por cada amigo que invites
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Tu amigo recibe <span className="font-semibold text-foreground">Q{discountAmount} de descuento</span> en su primer envío. Comparte tu link y ambos ganan.
              </p>
            </div>

            {/* CTA Button */}
            {referralLink && (
              <Button
                onClick={handleCopy}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-base shadow-md shadow-rose-200/50 transition-all"
                size="lg"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" /> ¡Link copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5 mr-2" /> Copiar mi link de referido
                  </>
                )}
              </Button>
            )}

            {/* Dismiss */}
            <button
              onClick={handleClose}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1 cursor-pointer"
            >
              Ahora no
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralAnnouncementModal;
