"use client";

import { useState, useEffect } from "react";

export interface CountdownTime {
  d: number;
  h: number;
  m: number;
  s: number;
  expired: boolean;
}

export function useCountdown(targetDate: string | Date): CountdownTime {
  const calc = (): CountdownTime => {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  };

  const [time, setTime] = useState<CountdownTime>(() => calc());

  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return time;
}
