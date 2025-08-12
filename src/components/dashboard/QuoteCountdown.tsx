import { formatDateTime } from "@/utils/dateHelpers";
import StatusAlert from "@/components/ui/status-alert";
import { useCountdown } from "@/hooks/useCountdown";

interface QuoteCountdownProps {
  expiresAt: string | Date;
  onExpire?: () => void;
  compact?: boolean;
}

const QuoteCountdown = ({ expiresAt, onExpire, compact = false }: QuoteCountdownProps) => {
  const timeLeft = useCountdown({ expiresAt, onExpire });

  if (timeLeft.isExpired) {
    if (compact) {
      return (
        <p className="text-sm text-destructive font-medium">
          ⏰ Expirado
        </p>
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
  const variant = isUrgent ? "warning" : "info";

  if (compact) {
    return (
      <p className="text-sm text-foreground">
        ⏰ Tiempo para responder: {timeLeft.hours}h {timeLeft.minutes}m restantes
      </p>
    );
  }

  return (
    <StatusAlert variant={variant} title="Tiempo para completar el pago">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-lg font-mono font-semibold">
          <span>{String(timeLeft.hours).padStart(2, '0')}</span>
          <span>:</span>
          <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span>:</span>
          <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
        </div>
        <p className="text-sm opacity-90">
          {isUrgent 
            ? "¡Tiempo limitado! Completa el pago pronto."
            : "Tienes tiempo suficiente para completar el pago."
          }
        </p>
        <p className="text-xs opacity-75">
          Expira: {formatDateTime(expiresAt)}
        </p>
      </div>
    </StatusAlert>
  );
};

export default QuoteCountdown;