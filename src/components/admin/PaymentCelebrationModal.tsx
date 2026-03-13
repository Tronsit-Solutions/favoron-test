import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plane, PartyPopper, ArrowRight, Download } from "lucide-react";
import { formatCurrency } from "@/utils/priceHelpers";
import { useRef, useCallback } from "react";
import html2canvas from "html2canvas";

interface PaymentCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  travelerName: string;
  fromCity: string;
  toCity: string;
}

const PaymentCelebrationModal = ({
  isOpen,
  onClose,
  amount,
  travelerName,
  fromCity,
  toCity
}: PaymentCelebrationModalProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `pago-${travelerName.replace(/\s+/g, '-')}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
    }
  }, [travelerName]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:text-white [&>button]:hover:text-white/80">
        <div className="space-y-4">
          {/* Shareable card */}
          <div
            ref={cardRef}
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 50%, hsl(262 80% 50%) 100%)",
            }}
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 right-8 w-20 h-20 rounded-full bg-white/5" />

            <div className="relative z-10 p-8 text-center space-y-5">
              {/* Emoji header */}
              <div className="flex items-center justify-center gap-3">
                <PartyPopper className="w-8 h-8 text-yellow-300 animate-bounce" />
                <span className="text-4xl">🎉</span>
                <PartyPopper className="w-8 h-8 text-yellow-300 animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>

              {/* Title */}
              <div>
                <p className="text-white/80 text-sm font-medium tracking-widest uppercase">
                  Pago completado
                </p>
                <h2 className="text-white text-lg font-bold mt-1">
                  ¡Gracias por traer Favorones! 🧳
                </h2>
              </div>

              {/* Amount */}
              <div className="bg-white/15 backdrop-blur-sm rounded-xl py-4 px-6 inline-block mx-auto">
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">
                  Tip del viajero
                </p>
                <p className="text-white text-4xl font-black tracking-tight">
                  {formatCurrency(amount)}
                </p>
              </div>

              {/* Traveler name */}
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider">Viajero</p>
                <p className="text-white text-xl font-bold">{travelerName}</p>
              </div>

              {/* Route */}
              <div className="flex items-center justify-center gap-3 text-white">
                <div className="text-right">
                  <Plane className="w-4 h-4 text-white/60 inline-block mr-1 -rotate-45" />
                  <span className="font-semibold text-lg">{fromCity}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-white/50 shrink-0" />
                <div className="text-left">
                  <span className="font-semibold text-lg">{toCity}</span>
                </div>
              </div>

              {/* Branding */}
              <div className="pt-2 border-t border-white/10">
                <p className="text-white/40 text-xs font-medium tracking-wider">
                  FAVORON · favoron.app
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 px-1">
            <Button
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar imagen
            </Button>
            <Button
              className="flex-1 bg-white text-primary hover:bg-white/90 font-semibold"
              onClick={onClose}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentCelebrationModal;
