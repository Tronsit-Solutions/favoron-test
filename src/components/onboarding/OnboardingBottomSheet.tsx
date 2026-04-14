import { useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeable } from "react-swipeable";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface OnboardingSlide {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface OnboardingBottomSheetProps {
  isOpen: boolean;
  onContinue: (dontShowAgain: boolean) => void;
  onClose: () => void;
  slides: OnboardingSlide[];
  /** Gradient classes for the hero area */
  gradientClassName?: string;
  /** Badge color variant */
  variant?: "shopper" | "traveler";
}

const OnboardingBottomSheet = ({
  isOpen,
  onContinue,
  onClose,
  slides,
  gradientClassName = "from-primary via-primary/80 to-primary/60",
  variant = "shopper",
}: OnboardingBottomSheetProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const isMobile = useIsMobile();

  const isLastSlide = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];

  const handleClose = useCallback(() => {
    setCurrentSlide(0);
    setDontShowAgain(false);
    onClose();
  }, [onClose]);

  const handleNext = () => {
    if (isLastSlide) {
      onContinue(dontShowAgain);
      setCurrentSlide(0);
      setDontShowAgain(false);
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
    },
    onSwipedRight: () => {
      if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
    },
    delta: 20,
    trackMouse: false,
    preventScrollOnSwipe: true,
    touchEventOptions: { passive: true },
  });

  const SlideIcon = slide?.icon;

  if (!slide) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={cn(
          "p-0 gap-0 overflow-hidden border-0 [&>button]:hidden",
          isMobile
            ? "fixed inset-x-0 bottom-0 top-auto w-full max-w-none rounded-t-3xl rounded-b-none translate-x-0 translate-y-0 left-0"
            : "max-w-md rounded-2xl"
        )}
      >
        <div
          className={cn("flex flex-col", isMobile && "max-h-[85vh]")}
          {...swipeHandlers}
        >
          {/* Hero area */}
          <div
            className={cn(
              "relative h-44 sm:h-52 bg-gradient-to-br flex items-center justify-center overflow-hidden",
              gradientClassName
            )}
          >
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute top-8 left-8 w-16 h-16 rounded-full bg-white/15" />

            {/* Icon */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <SlideIcon className="h-10 w-10 text-white" />
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
                <span className="text-sm font-semibold text-white">
                  {currentSlide + 1} de {slides.length}
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
            <div className="space-y-2 min-h-[80px]">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                {slide.title}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {slide.description}
              </p>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 pt-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all cursor-pointer",
                    currentSlide === i
                      ? cn(
                          "w-5",
                          variant === "traveler"
                            ? "bg-traveler"
                            : "bg-primary"
                        )
                      : "bg-muted-foreground/30"
                  )}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleNext}
              variant={variant === "traveler" ? "traveler" : "shopper"}
              className="w-full h-12 rounded-xl font-semibold text-base shadow-md"
              size="lg"
            >
              {isLastSlide ? "Continuar" : "Siguiente"}
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>

            {/* Don't show again - only on last slide */}
            {isLastSlide && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="onboarding-dont-show"
                    checked={dontShowAgain}
                    onCheckedChange={(checked) =>
                      setDontShowAgain(checked === true)
                    }
                  />
                  <Label
                    htmlFor="onboarding-dont-show"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    No volver a mostrar
                  </Label>
                </div>
                <button
                  onClick={() => {
                    onContinue(dontShowAgain);
                    setCurrentSlide(0);
                    setDontShowAgain(false);
                  }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1 cursor-pointer"
                >
                  Saltar
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingBottomSheet;
