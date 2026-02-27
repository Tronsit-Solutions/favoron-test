import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Copy, CheckCircle, X, ArrowRight, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeable } from "react-swipeable";
import { cn } from "@/lib/utils";

interface ReferralAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReferralAnnouncementModal = ({ isOpen, onClose }: ReferralAnnouncementModalProps) => {
  const [rewardAmount, setRewardAmount] = useState(30);
  const [discountAmount, setDiscountAmount] = useState(15);
  const [copied, setCopied] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
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
    if (isOpen) {
      fetchSettings();
      setCurrentSlide(0);
      setCopied(false);
    }
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

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setCurrentSlide(1),
    onSwipedRight: () => setCurrentSlide(0),
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={cn(
        "p-0 gap-0 overflow-hidden border-0 [&>button]:hidden",
        isMobile
          ? "fixed inset-x-0 bottom-0 top-auto w-full max-w-none rounded-t-3xl rounded-b-none translate-x-0 translate-y-0 left-0"
          : "max-w-md rounded-2xl"
      )}>
        <div className={cn("flex flex-col", isMobile && "max-h-[85vh]")} {...swipeHandlers}>
          {/* Hero area */}
          <div className="relative h-52 sm:h-56 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute top-8 left-8 w-16 h-16 rounded-full bg-white/15" />

            {/* Slide-dependent icon */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                {currentSlide === 0 ? (
                  <Gift className="h-10 w-10 text-white" />
                ) : (
                  <Users className="h-10 w-10 text-white" />
                )}
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
                <span className="text-sm font-semibold text-white">
                  {currentSlide === 0 ? "Programa de Referidos" : "Comparte y gana"}
                </span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-sm flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 bg-background">
            {currentSlide === 0 ? (
              /* Slide 1 - Intro */
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  Gana Q{rewardAmount} por cada amigo
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Invita a tus amigos a usar Favoron. Cada vez que uno complete su primer envío, 
                  tú recibes <span className="font-semibold text-foreground">Q{rewardAmount}</span> de recompensa.
                </p>
              </div>
            ) : (
              /* Slide 2 - Action */
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  Ambos ganan
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Tu amigo recibe <span className="font-semibold text-foreground">Q{discountAmount} de descuento</span> en 
                  su primer envío, y tú ganas <span className="font-semibold text-foreground">Q{rewardAmount}</span>. ¡Comparte tu link!
                </p>
              </div>
            )}

            {/* Dots */}
            <div className="flex justify-center gap-2 pt-1">
              {[0, 1].map((i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all cursor-pointer",
                    currentSlide === i
                      ? "bg-gradient-to-r from-orange-400 to-pink-500 w-5"
                      : "bg-muted-foreground/30"
                  )}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            {/* CTA Button */}
            {currentSlide === 0 ? (
              <Button
                onClick={() => setCurrentSlide(1)}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:from-orange-500 hover:via-pink-600 hover:to-purple-700 text-white font-semibold text-base shadow-md transition-all"
                size="lg"
              >
                Siguiente <ArrowRight className="h-5 w-5 ml-1" />
              </Button>
            ) : referralLink ? (
              <Button
                onClick={handleCopy}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:from-orange-500 hover:via-pink-600 hover:to-purple-700 text-white font-semibold text-base shadow-md transition-all"
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
            ) : null}

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
