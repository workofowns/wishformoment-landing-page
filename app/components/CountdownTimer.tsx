"use client";

import { useEffect, useState, useMemo, useSyncExternalStore } from "react";
import { siteConfig } from "@/config/siteConfig";

interface TimeLeft {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

interface CountdownTimerProps {
  targetDate?: string | Date;
  onLaunch?: () => void;
}

const emptySubscribe = () => () => { };

export default function CountdownTimer({ targetDate: customTarget, onLaunch }: CountdownTimerProps) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const targetTime = useMemo(() => {
    const raw = customTarget || siteConfig.launchDate || "2026-11-08T18:00:00+05:30";
    return new Date(raw).getTime();
  }, [customTarget]);

  const [isLive, setIsLive] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => {
    const now = Date.now();
    const diff = targetTime - now;
    if (diff <= 0) {
      return { days: "00", hours: "00", minutes: "00", seconds: "00" };
    }
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return {
      days: String(d).padStart(2, "0"),
      hours: String(h).padStart(2, "0"),
      minutes: String(m).padStart(2, "0"),
      seconds: String(s).padStart(2, "0"),
    };
  });

  useEffect(() => {
    if (!isMounted) return;

    const calculateTime = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setIsLive(true);
        setTimeLeft({
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00",
        });
        onLaunch?.();
        return false;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        days: String(d).padStart(2, "0"),
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
      });

      return true;
    };

    calculateTime();
    const timer = setInterval(() => {
      const active = calculateTime();
      if (!active) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isMounted, targetTime, onLaunch]);

  // Initial SSR / Unmounted state: completely invisible (opacity 0) without any placeholder cards or '--' flash
  if (!isMounted) {
    return (
      <div
        className="pt-1 sm:pt-1.5 md:pt-3 opacity-0 pointer-events-none select-none h-[44px] sm:h-[54px] md:h-[70px]"
        aria-hidden="true"
      />
    );
  }

  // Celebratory "We Are Live!" view
  if (isLive) {
    return (
      <div className="pt-1 sm:pt-1.5 md:pt-3 animate-in fade-in zoom-in-95 duration-500">
        <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-2 sm:p-2.5 pr-3.5 sm:pr-4 rounded-2xl bg-gradient-to-r from-emerald-500/90 via-teal-500/90 to-emerald-600/90 backdrop-blur-xl border border-white/90 shadow-[0_10px_25px_-3px_rgba(16,185,129,0.35)] text-white">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-[10px] sm:text-xs font-bold tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-ping" />
            <span>Platform Live</span>
          </div>
          <span className="font-semibold text-xs sm:text-sm md:text-base drop-shadow-sm text-center sm:text-left">
            WishForMoment is officially open! 🎉
          </span>
          <a
            href={siteConfig.url}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white text-emerald-800 font-bold text-[11px] sm:text-xs hover:bg-emerald-50 hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            <span>Enter Now</span>
            <svg className="w-3.5 h-3.5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  const timerItems = [
    { label: "DAYS", value: timeLeft.days },
    { label: "HOURS", value: timeLeft.hours },
    { label: "MINUTES", value: timeLeft.minutes },
    { label: "SECONDS", value: timeLeft.seconds },
  ];

  return (
    <div
      className="mb-4 sm:mb-0 pt-1 sm:pt-1.5 md:pt-3 animate-reveal-up"
      style={{ animationDelay: "900ms" }}
      aria-label="Launch Countdown Timer"
    >
      <div className="inline-flex items-center gap-1 sm:gap-1.5 md:gap-[6px]">
        {timerItems.map((item, index) => (
          <div
            key={item.label}
            className="animate-card-pop"
            style={{ animationDelay: `${950 + index * 110}ms` }}
          >
            <div
              className="flex items-center gap-1 sm:gap-1.5 md:gap-[6px] animate-float-timer"
              style={{ animationDelay: `${index * 0.28}s` }}
            >
              {/* Liquid Water Jelly Card */}
              <div className="relative group w-[40px] h-[44px] sm:w-[50px] sm:h-[54px] md:w-[66px] md:h-[70px] rounded-[13px] sm:rounded-[17px] md:rounded-[22px] flex flex-col items-center justify-center bg-gradient-to-b from-white/90 via-purple-100/60 to-purple-200/65 backdrop-blur-xl border border-white/90 shadow-[0_4px_14px_-2px_rgba(112,65,199,0.2),inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(147,51,234,0.15)] hover:scale-105 transition-all duration-300 cursor-default select-none overflow-hidden">
                {/* Top Curved Specular Glaze */}
                <div className="absolute top-0.5 sm:top-1 inset-x-1 sm:inset-x-1.5 h-1.5 sm:h-3 bg-gradient-to-b from-white/95 via-white/50 to-transparent rounded-t-[11px] sm:rounded-t-[16px] pointer-events-none" />

                {/* Corner Specular Droplet Spot */}
                <div className="absolute top-1 sm:top-1.5 left-1 sm:left-1.5 w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-white blur-[0.2px] pointer-events-none" />

                {/* Bottom Soft Reflection */}
                <div className="absolute bottom-0.5 sm:bottom-1 inset-x-2 h-0.5 sm:h-1 bg-white/40 rounded-full blur-[1px] pointer-events-none" />

                {/* Shimmer Light Reflection Sweep Across Glass */}
                <div className="absolute inset-0 rounded-[13px] sm:rounded-[17px] md:rounded-[22px] overflow-hidden pointer-events-none">
                  <div
                    className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] animate-shimmer-sweep"
                    style={{ animationDelay: `${index * 0.75}s` }}
                  />
                </div>

                {/* Smooth Rolling Digits */}
                <div className="relative z-10 h-4 sm:h-5 md:h-7 flex items-center justify-center overflow-hidden">
                  <span
                    key={item.value}
                    className="text-sm sm:text-lg md:text-[25px] font-semibold text-[#1f104d] tracking-tight leading-none drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)] animate-in fade-in slide-in-from-bottom-1 duration-200"
                  >
                    {item.value}
                  </span>
                </div>

                {/* Label */}
                <span className="relative z-10 text-[6px] sm:text-[7.5px] md:text-[9px] font-bold text-[#554585] tracking-wider uppercase mt-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
                  {item.label}
                </span>
              </div>

              {/* Sparkling Diamond Separator between cards */}
              {index < timerItems.length - 1 && (
                <div className="flex items-center justify-center">
                  <span className="text-amber-300 text-[8px] sm:text-[10px] md:text-xs drop-shadow-[0_0_8px_rgba(251,191,36,0.95)] animate-twinkle select-none">
                    ✦
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
