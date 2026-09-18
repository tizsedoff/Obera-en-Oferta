import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface CountdownTimerProps {
  expiryDate: string;
  size?: 'sm' | 'md';
}

export default function CountdownTimer({ expiryDate, size = 'sm' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, isUrgent: false, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const parsed = new Date(expiryDate);
      const difference = parsed.getTime() - Date.now();
      if (!expiryDate || Number.isNaN(parsed.getTime()) || difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isUrgent: false, expired: true };
      }

      const totalHours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      return {
        hours: totalHours,
        minutes,
        seconds,
        isUrgent: totalHours < 6,
        expired: false
      };
    };

    // Initial run
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const next = calculateTimeLeft();
      setTimeLeft(next);
      if (next.expired) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  const pad = (n: number) => String(n).padStart(2, '0');

  if (timeLeft.expired) {
    return <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black border bg-slate-100 text-slate-500 border-slate-200">Oferta vencida</div>;
  }

  if (size === 'md') {
    return (
      <div className={`flex items-center gap-2 p-3.5 rounded-2xl border transition-all ${
        timeLeft.isUrgent 
          ? 'bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400 shadow-sm shadow-red-500/5 animate-pulse'
          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
      }`}>
        <Timer className="w-5 h-5 shrink-0 animate-spin-slow" />
        <div className="flex-1">
          <span className="text-[10px] font-black uppercase tracking-wider block leading-none mb-1 opacity-75">
            {timeLeft.isUrgent ? '¡Casi Expirado! Tiempo restante:' : 'Oferta Flash - Quedan:'}
          </span>
          <div className="font-mono font-black text-sm tracking-widest flex items-center gap-1">
            <span>{pad(timeLeft.hours)}</span>
            <span className="animate-pulse">:</span>
            <span>{pad(timeLeft.minutes)}</span>
            <span className="animate-pulse">:</span>
            <span className="text-red-500">{pad(timeLeft.seconds)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono font-black border transition-all ${
      timeLeft.isUrgent 
        ? 'bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 border-red-100 dark:border-red-900/30 animate-pulse' 
        : 'bg-amber-50 dark:bg-amber-950/30 text-amber-650 dark:text-amber-400 border-amber-100 dark:border-amber-900/20'
    }`}>
      <Timer className="w-3.5 h-3.5 shrink-0" />
      <span>{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
    </div>
  );
}
