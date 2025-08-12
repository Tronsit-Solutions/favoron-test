import { useState, useEffect } from "react";

interface UseCountdownProps {
  expiresAt: string | Date;
  onExpire?: () => void;
}

interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export const useCountdown = ({ expiresAt, onExpire }: UseCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<CountdownState>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

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

  return timeLeft;
};