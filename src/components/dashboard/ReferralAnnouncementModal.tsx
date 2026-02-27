import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Share2, ShoppingBag, Trophy, Copy, CheckCircle } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ReferralAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReferralAnnouncementModal = ({ isOpen, onClose }: ReferralAnnouncementModalProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [rewardAmount, setRewardAmount] = useState(30);
  const [discountAmount, setDiscountAmount] = useState(15);
  const [copied, setCopied] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const referralCode = (profile as any)?.referral_code;
  const referralLink = referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : "";

  // Fetch dynamic amounts from app_settings
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

  const totalSlides = 3;

  const next = useCallback(() => {
    if (currentSlide < totalSlides - 1) setCurrentSlide((s) => s + 1);
  }, [currentSlide]);

  const handleClose = useCallback(() => {
    setCurrentSlide(0);
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
    onSwipedLeft: next,
    onSwipedRight: () => currentSlide > 0 && setCurrentSlide((s) => s - 1),
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  const slides = [
    // Slide 1 — Intro
    {
      gradient: "from-orange-400 via-pink-500 to-purple-600",
      icon: <Gift className="h-16 w-16 text-white" />,
      title: "¡Nuevo! Programa de Referidos",
      description: "Ahora puedes ganar dinero invitando a tus amigos a Favorón. ¡Comparte, ahorra y gana juntos!",
    },
    // Slide 2 — How it works
    {
      gradient: "from-violet-500 via-indigo-500 to-blue-500",
      icon: null, // custom content
      title: "Así funciona",
      description: "",
      custom: (
        <div className="flex flex-col gap-4 w-full px-2">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Share2 className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white text-sm">1. Comparte tu link</p>
              <p className="text-white/80 text-xs">Envía tu link personalizado a tus amigos</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white text-sm">2. Tu amigo hace su primer pedido</p>
              <p className="text-white/80 text-xs">
                Recibe <span className="font-bold text-yellow-300">Q{discountAmount}</span> de descuento en su primer envío
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white text-sm">3. ¡Ambos ganan!</p>
              <p className="text-white/80 text-xs">
                Tú recibes <span className="font-bold text-yellow-300">Q{rewardAmount}</span> de recompensa
              </p>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 3 — CTA
    {
      gradient: "from-emerald-400 via-teal-500 to-cyan-500",
      icon: <CheckCircle className="h-16 w-16 text-white" />,
      title: "¡Empieza ahora!",
      description: "Copia tu link de referido y compártelo para empezar a ganar recompensas.",
    },
  ];

  const slide = slides[currentSlide];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="p-0 gap-0 max-w-sm overflow-hidden rounded-2xl border-0 [&>button]:hidden">
        <div {...swipeHandlers} className="select-none">
          {/* Top gradient section */}
          <div
            className={cn(
              "bg-gradient-to-br flex flex-col items-center justify-center py-10 px-6 min-h-[220px] transition-all duration-500",
              slide.gradient
            )}
          >
            {slide.icon && <div className="mb-3 animate-in fade-in zoom-in duration-500">{slide.icon}</div>}
            {slide.custom && <div className="w-full animate-in fade-in slide-in-from-right-4 duration-500">{slide.custom}</div>}
          </div>

          {/* Bottom white section */}
          <div className="bg-background p-6 text-center space-y-4">
            <h2 className="text-xl font-bold text-foreground">{slide.title}</h2>
            {slide.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{slide.description}</p>
            )}

            {/* CTA on last slide */}
            {currentSlide === totalSlides - 1 && referralLink && (
              <Button
                onClick={handleCopy}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" /> ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" /> Copiar mi link de referido
                  </>
                )}
              </Button>
            )}

            {/* Dots */}
            <div className="flex justify-center gap-2 pt-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer",
                    i === currentSlide ? "bg-primary scale-110" : "bg-muted-foreground/30"
                  )}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Navigation button */}
            <div className="pt-1">
              {currentSlide < totalSlides - 1 ? (
                <Button onClick={next} className="w-full" size="lg">
                  Siguiente
                </Button>
              ) : (
                <Button onClick={handleClose} variant="ghost" className="w-full text-muted-foreground">
                  Cerrar
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralAnnouncementModal;
