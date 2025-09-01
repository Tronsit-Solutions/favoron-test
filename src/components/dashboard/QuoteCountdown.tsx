import { formatDateTime } from "@/utils/dateHelpers";
import StatusAlert from "@/components/ui/status-alert";
import { useCountdown } from "@/hooks/useCountdown";
import { Clock, AlertTriangle } from "lucide-react";

interface QuoteCountdownProps {
  expiresAt: string | Date;
  onExpire?: () => void;
  compact?: boolean;
  micro?: boolean; // New ultra-compact version
}

const QuoteCountdown = ({ expiresAt, onExpire, compact = false, micro = false }: QuoteCountdownProps) => {
  const timeLeft = useCountdown({ expiresAt, onExpire });

  if (timeLeft.isExpired) {
    if (micro) {
      return (
        <div className="flex items-center gap-1 text-xs text-destructive bg-red-50 px-2 py-1 rounded">
          <AlertTriangle className="h-3 w-3" />
          <span>Expirado</span>
        </div>
      );
    }
    
    if (compact) {
      return (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive font-medium">
            Expirado
          </p>
        </div>
      );
    }
    return (
      <StatusAlert variant="warning" title="Cotización expirada">
        <p className="text-sm">
          Esta cotización expiró el {formatDateTime(expiresAt)}. 
          El viajero debe enviar una nueva cotización.
        </p>
      </StatusAlert>
    );
  }

  const isUrgent = timeLeft.hours < 3;

  if (micro) {
    return (
      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded font-mono ${
        isUrgent ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
      }`}>
        <Clock className="h-3 w-3" />
        <span>{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}</span>
      </div>
    );
  }

  const variant = isUrgent ? "warning" : "info";

  if (compact) {
    return (
      <div className="inline-flex items-center gap-0.5 bg-green-50 border border-green-200 rounded text-xs px-1 py-0.5">
        <Clock className="h-4 w-4 text-green-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900">
            Tiempo para responder
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1 font-mono text-lg font-bold text-green-700">
              <span className="bg-white px-2 py-1 rounded border">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-white px-2 py-1 rounded border">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
            </div>
            <span className="text-xs text-green-600 font-medium">restantes</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StatusAlert variant={variant} title="Tiempo para completar el pago">
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-2 font-mono text-2xl font-bold">
            <div className="bg-background border-2 px-3 py-2 rounded-lg shadow-sm">
              <span>{String(timeLeft.hours).padStart(2, '0')}</span>
            </div>
            <span className="text-muted-foreground">:</span>
            <div className="bg-background border-2 px-3 py-2 rounded-lg shadow-sm">
              <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
            </div>
            <span className="text-muted-foreground">:</span>
            <div className="bg-background border-2 px-3 py-2 rounded-lg shadow-sm">
              <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium">
            HORAS : MINUTOS : SEGUNDOS
          </p>
        </div>
        <p className="text-sm opacity-90 text-center">
          {isUrgent 
            ? "¡Tiempo limitado! Completa el pago pronto."
            : "Tienes tiempo suficiente para completar el pago."
          }
        </p>
        <p className="text-xs opacity-75 text-center">
          Expira: {formatDateTime(expiresAt)}
        </p>
      </div>
    </StatusAlert>
  );
};

export default QuoteCountdown;
