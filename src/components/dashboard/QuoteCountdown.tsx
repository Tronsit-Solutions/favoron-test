import { useState, useEffect } from "react";
import { formatDateTime, getDaysUntil } from "@/utils/dateHelpers";
import StatusAlert from "@/components/ui/status-alert";

interface QuoteCountdownProps {
  expiresAt: string | Date;
  onExpire?: () => void;
}

const QuoteCountdown = ({ expiresAt, onExpire }: QuoteCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expireTime = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const difference = expireTime - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        onExpire?.();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (timeLeft.isExpired) {
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