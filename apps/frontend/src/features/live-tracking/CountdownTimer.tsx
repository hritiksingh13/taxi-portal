import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  estimatedCompletion: string;
}

export function CountdownTimer({ estimatedCompletion }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('Calculating...');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const targetDate = new Date(estimatedCompletion).getTime();

    const tick = () => {
      const now = Date.now();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft('Trip Complete');
        setIsOverdue(true);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [estimatedCompletion]);

  return (
    <div className={`flex items-center gap-1.5 font-mono text-sm font-semibold ${
      isOverdue ? 'text-emerald-400' : 'text-amber-400'
    }`}>
      <Clock size={13} />
      {timeLeft}
    </div>
  );
}
