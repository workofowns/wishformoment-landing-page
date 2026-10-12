"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useGoogleLogin } from "@react-oauth/google";

// Standard API endpoints
export const OAUTH_GOOGLE_ENDPOINT = "/auth/oauth/google";

// Helper to map spin wheel offer to standard backend reward code
export function getRewardCodeFromOffer(offer: OfferItem): string {
  if (offer.id === 0 || offer.label.includes("Premium")) return "FREE_PREMIUM_WISH";
  if (offer.id === 1 || offer.label.includes("50%")) return "DISCOUNT_50";
  if (offer.id === 2 || offer.label.includes("80%")) return "DISCOUNT_80";
  if (offer.id === 3 || offer.label.includes("30%")) return "DISCOUNT_30";
  if (offer.id === 4 || offer.label.includes("40%")) return "DISCOUNT_40";
  return "DISCOUNT_50";
}

// Exact 5 offers requested by user
export interface OfferItem {
  id: number;
  label: string;
  sublabel: string;
  color: string;
}

const OFFERS: OfferItem[] = [
  {
    id: 0,
    label: "1 Premium Wish",
    sublabel: "100% Free First Time",
    color: "#e11d48", // Rose Red
  },
  {
    id: 1,
    label: "50% Discount",
    sublabel: "Half Off Any Wish",
    color: "#7c3aed", // Royal Violet
  },
  {
    id: 2,
    label: "80% Discount",
    sublabel: "Mega Launch Savings",
    color: "#f59e0b", // Golden Amber
  },
  {
    id: 3,
    label: "30% Discount",
    sublabel: "Launch Celebration Pass",
    color: "#0284c7", // Sky Blue
  },
  {
    id: 4,
    label: "40% Discount",
    sublabel: "Special Moment Offer",
    color: "#c026d3", // Fuchsia
  },
];

interface ClaimedData {
  offer: OfferItem;
  email?: string;
  claimed: boolean;
  date: string;
  rewardCode?: string;
}

export interface OfferSpinnerProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function OfferSpinner({ isOpen: controlledIsOpen, onOpenChange }: OfferSpinnerProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setModalOpen = (open: boolean) => {
    setInternalIsOpen(open);
    onOpenChange?.(open);
  };
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isFlapperWiggling, setIsFlapperWiggling] = useState(false);
  const [isSubmittingApi, setIsSubmittingApi] = useState(false);
  const [apiSuccessMsg, setApiSuccessMsg] = useState<string | null>(null);

  const [savedData, setSavedData] = useState<ClaimedData | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Load saved assigned offer strictly after client mount to prevent SSR hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    try {
      const data = localStorage.getItem("wish_assigned_user_offer");
      if (data) {
        setSavedData(JSON.parse(data));
      }
    } catch {
      // Ignore
    }
  }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize or resume Web Audio Context
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Mechanical wheel peg click sound
  const playPegTick = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(1200 + Math.random() * 200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.025);

      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.026);
    } catch {
      // Ignore
    }
  };

  // Celebratory winning fanfare chime
  const playWinSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * 0.09;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.12, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.46);
      });
    } catch {
      // Ignore
    }
  };

  // Trigger celebration confetti
  const triggerConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = ["#e11d48", "#f59e0b", "#7c3aed", "#0284c7", "#10b981", "#ec4899", "#ffd700"];
    const particles = Array.from({ length: 85 }).map(() => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.7) * 16,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
    }));

    let frame = 0;
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.alpha -= 0.012;
        if (p.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
      if (frame < 120) {
        requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    loop();
  }, []);

  // Spin the wheel with mechanical voice/tick sound schedule
  const handleSpin = () => {
    if (isSpinning || savedData) return;

    setIsSpinning(true);
    setIsFlapperWiggling(true);

    // Pick 1 of the 5 offers randomly (fair 1 in 5 chance)
    const targetIndex = Math.floor(Math.random() * OFFERS.length);
    const targetOffer = OFFERS[targetIndex];

    // Math: 5 slices = 72 deg each. Segment mid angle = targetIndex * 72 + 36.
    // Pointer is positioned at top (270 deg). Angle to stop = 270 - mid.
    const segmentMid = targetIndex * 72 + 36;
    const targetDeg = (270 - segmentMid + 360) % 360;

    // Minimum 6 full rotations (2160 deg) for suspenseful, realistic spin
    const totalRotation = 2160 + targetDeg;
    setRotation(totalRotation);

    // Schedule realistic mechanical peg ticking sounds that decelerate naturally
    const totalDuration = 4400; // 4.4 seconds
    const tickTimeouts: NodeJS.Timeout[] = [];

    // Realistic physics: intervals start dense and expand as wheel slows down
    let currentT = 0;
    let interval = 55; // Initial fast ticking (ms)
    while (currentT < totalDuration - 200) {
      currentT += interval;
      // Exponentially increase interval as wheel approaches destination
      interval = Math.min(600, interval * 1.07);
      const t = currentT;
      const timer = setTimeout(() => {
        playPegTick();
      }, t);
      tickTimeouts.push(timer);
    }

    // Wheel stops
    setTimeout(() => {
      setIsSpinning(false);
      setIsFlapperWiggling(false);
      triggerConfetti();
      playWinSound();

      const newAssignment: ClaimedData = {
        offer: targetOffer,
        claimed: false,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };

      setSavedData(newAssignment);
      try {
        localStorage.setItem("wish_assigned_user_offer", JSON.stringify(newAssignment));
      } catch {
        // Ignore
      }
    }, totalDuration);
  };

  const [googleError, setGoogleError] = useState<string | null>(null);

  // Google OAuth Login Integration with WishForMoment Backend API
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!savedData || isSubmittingApi) return;

      setIsSubmittingApi(true);
      setGoogleError(null);
      setApiSuccessMsg(null);

      const rewardKey = getRewardCodeFromOffer(savedData.offer);
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://stage.api.wishformoment.com";

      try {
        const res = await fetch(`${apiBaseUrl}${OAUTH_GOOGLE_ENDPOINT}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessToken: tokenResponse.access_token,
            reward: rewardKey,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const errorMsg =
            errData?.error?.message ||
            errData?.message ||
            "Failed to claim reward with Google";
          throw new Error(errorMsg);
        }

        const data = await res.json();
        const userEmail = data?.user?.email || "Google Account Connected";

        const updated: ClaimedData = {
          ...savedData,
          email: userEmail,
          claimed: true,
          rewardCode: rewardKey,
        };
        setSavedData(updated);
        try {
          localStorage.setItem("wish_assigned_user_offer", JSON.stringify(updated));
        } catch {
          // Ignore
        }

        setApiSuccessMsg(`Reward saved to ${userEmail}! ✨`);
        triggerConfetti();
        playWinSound();
      } catch (err: unknown) {
        console.error("Google OAuth error:", err);
        const message = err instanceof Error ? err.message : "Authentication failed. Please try again.";
        setGoogleError(message);
      } finally {
        setIsSubmittingApi(false);
      }
    },
    onError: (error) => {
      console.error("Google sign in error:", error);
      setGoogleError(error.error_description || "Google sign-in was cancelled or failed.");
    },
  });

  return (
    <>
      {/* Celebration Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />

      {/* Floating Pill on Landing Page (Bottom Right) with Infinite Eye-Catching Animation */}
      <div className="absolute bottom-6 sm:bottom-8 right-5 sm:right-8 md:right-12 z-30 select-none animate-float-gentle">
        {/* Infinite Radar Glow Wave Ring */}
        {(!isMounted || !savedData) && (
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-400 via-fuchsia-500 to-purple-600 opacity-60 blur-md animate-radar-pulse pointer-events-none" />
        )}

        {/* Live Eye-Catching "FREE SPIN" Pulsing Badge */}
        {(!isMounted || !savedData) && (
          <div className="absolute -top-3 right-6 z-40 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 text-[9px] font-black text-white uppercase tracking-wider shadow-[0_2px_12px_rgba(245,158,11,0.8)] border border-white/80 flex items-center gap-1.5 animate-pulse pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-200 animate-ping shrink-0" />
            <span>FREE SPIN 🎁</span>
          </div>
        )}

        <button
          onClick={() => setModalOpen(true)}
          suppressHydrationWarning
          className={`relative flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full backdrop-blur-md border transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group overflow-hidden ${
            isMounted && savedData?.claimed
              ? "bg-[#183628]/90 border-emerald-400/40 shadow-[0_8px_25px_rgba(16,185,129,0.3)]"
              : isMounted && savedData
                ? "bg-[#3f1655]/90 border-amber-400/50 animate-pulse shadow-[0_8px_28px_rgba(245,158,11,0.35)]"
                : "bg-gradient-to-r from-[#2c1348]/95 via-[#3f195e]/95 to-[#240e3d]/95 hover:from-[#38185c]/95 hover:to-[#2e124f]/95 border-amber-300/60 animate-pulse-glow-spin"
            }`}
        >
          {/* Infinite Shimmer Sweep Reflection */}
          {(!isMounted || !savedData?.claimed) && (
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] animate-shimmer-sweep" />
            </div>
          )}

          {/* 3D Spin Wheel Icon with Continuous Infinite Rotation */}
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center">
            <svg
              className="w-full h-full drop-shadow-[0_2px_12px_rgba(245,158,11,0.85)] animate-slow-spin group-hover:[animation-duration:3s] transition-transform duration-700 ease-out"
              viewBox="0 0 32 32"
              fill="none"
            >
              {/* Outer Golden Rim */}
              <circle cx="16" cy="16" r="14.5" stroke="url(#wheelRimGrad)" strokeWidth="2.5" />

              {/* Colorful Slices */}
              <path d="M16 16 L30 16 A14 14 0 0 1 23 28.12 Z" fill="#e11d48" />
              <path d="M16 16 L23 28.12 A14 14 0 0 1 9 28.12 Z" fill="#7c3aed" />
              <path d="M16 16 L9 28.12 A14 14 0 0 1 2 16 Z" fill="#f59e0b" />
              <path d="M16 16 L2 16 A14 14 0 0 1 9 3.88 Z" fill="#0284c7" />
              <path d="M16 16 L9 3.88 A14 14 0 0 1 23 3.88 Z" fill="#10b981" />
              <path d="M16 16 L23 3.88 A14 14 0 0 1 30 16 Z" fill="#c026d3" />

              {/* Slice Divider Spokes */}
              <line x1="16" y1="16" x2="30" y2="16" stroke="white" strokeWidth="1" opacity="0.6" />
              <line x1="16" y1="16" x2="23" y2="28.12" stroke="white" strokeWidth="1" opacity="0.6" />
              <line x1="16" y1="16" x2="9" y2="28.12" stroke="white" strokeWidth="1" opacity="0.6" />
              <line x1="16" y1="16" x2="2" y2="16" stroke="white" strokeWidth="1" opacity="0.6" />
              <line x1="16" y1="16" x2="9" y2="3.88" stroke="white" strokeWidth="1" opacity="0.6" />
              <line x1="16" y1="16" x2="23" y2="3.88" stroke="white" strokeWidth="1" opacity="0.6" />

              {/* Center 3D Hub Cap */}
              <circle cx="16" cy="16" r="4.5" fill="url(#hubPillGrad)" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx="16" cy="16" r="1.6" fill="#1e1044" />

              {/* Top Mini Flapper Pointer */}
              <polygon points="16,0 18.5,4 13.5,4" fill="#fbbf24" stroke="#78350f" strokeWidth="0.5" />

              <defs>
                <linearGradient id="wheelRimGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#fef08a" />
                  <stop offset="0.5" stopColor="#f59e0b" />
                  <stop offset="1" stopColor="#b45309" />
                </linearGradient>
                <linearGradient id="hubPillGrad" x1="13" y1="13" x2="19" y2="19" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ffffff" />
                  <stop offset="0.6" stopColor="#fcd34d" />
                  <stop offset="1" stopColor="#d97706" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Two-Line Prompt */}
          <div suppressHydrationWarning className="flex flex-col text-left leading-tight">
            <span suppressHydrationWarning className="font-[family-name:var(--font-poppins)] text-xs sm:text-[13px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              {isMounted && savedData?.claimed
                ? `Saved: ${savedData.offer.label}`
                : isMounted && savedData
                  ? `You Won: ${savedData.offer.label}!`
                  : "Spin & Win a Special Surprise!"}
            </span>
            <span suppressHydrationWarning className="font-[family-name:var(--font-poppins)] text-[10px] sm:text-[11px] font-medium text-pink-200/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              {isMounted && savedData?.claimed
                ? "Saved to account • View details"
                : isMounted && savedData
                  ? "Click to Claim with Google ✨"
                  : "1 Free Premium Wish or up to 80% OFF"}
            </span>
          </div>
        </button>
      </div>

      {/* LIGHT THEME REALISTIC SPINNER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-2xl border border-amber-200/70 p-6 sm:p-8 text-neutral-900 shadow-[0_25px_80px_rgba(30,10,60,0.25)] text-center font-sans">
            {/* Close Button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>

            {/* Sparkle Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold tracking-wide uppercase mb-2">
              <span>✨ Exclusive Launch Offer</span>
            </div>

            {/* Modal Title (Light Theme) */}
            <h2 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#1f104d]">
              {savedData ? "Your Assigned Launch Surprise" : "Spin & Win Your Special Surprise"}
            </h2>
            <p className="text-xs text-neutral-600 mt-1 max-w-xs mx-auto">
              {savedData
                ? "This exclusive gift is reserved for your account when our website launches!"
                : "Spin once to unlock an exclusive offer: 1 Free Premium Wish or up to 80% discount!"}
            </p>

            {/* REALISTIC 3D WHEEL STAGE WITH BLUR & FLOATING PRIZE OVERLAY */}
            <div className="relative my-4 sm:my-5 flex items-center justify-center min-h-[280px] sm:min-h-[310px]">
              {/* Realistic Top Flapper / Needle */}
              <div
                className={`absolute -top-3.5 z-20 w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-t-[22px] border-t-amber-500 drop-shadow-[0_4px_6px_rgba(217,119,6,0.6)] transition-all duration-300 ${isFlapperWiggling ? "rotate-6 scale-110" : "rotate-0"
                  } ${savedData ? "opacity-30 blur-[1px]" : "opacity-100"}`}
              >
                {/* Flapper Pivot Pin Dot */}
                <div className="absolute -top-[23px] -left-[4px] w-2 h-2 rounded-full bg-white shadow-sm" />
              </div>

              {/* Outer Golden Bezel Frame with Metallic Rivets (Clickable to spin before completion) */}
              <div
                onClick={!savedData && !isSpinning ? handleSpin : undefined}
                role={!savedData && !isSpinning ? "button" : undefined}
                aria-label="Click to spin the wheel"
                title={!savedData && !isSpinning ? "Click the wheel to spin!" : undefined}
                className={`relative p-2.5 rounded-full bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#b45309] shadow-[0_12px_35px_rgba(180,83,9,0.35),inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-3px_5px_rgba(120,53,15,0.4)] transition-all duration-700 ${savedData
                    ? "filter blur-[6px] sm:blur-[7px] opacity-65 scale-[0.97] pointer-events-none"
                    : isSpinning
                      ? "opacity-100 scale-100 cursor-default"
                      : "opacity-100 scale-100 cursor-pointer hover:scale-[1.03] active:scale-95 group"
                  }`}
              >
                {/* Rotating 3D Wheel Container */}
                <div
                  className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden shadow-inner"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? "transform 4.4s cubic-bezier(0.12, 0.92, 0.22, 1)" : "none",
                  }}
                >
                  {/* SVG Wheel with 5 Realistic Segments */}
                  <svg className="w-full h-full rounded-full" viewBox="0 0 300 300">
                    <defs>
                      <radialGradient id="hubSpecular" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="45%" stopColor="#fcd34d" />
                        <stop offset="100%" stopColor="#b45309" />
                      </radialGradient>
                    </defs>

                    {OFFERS.map((offer, i) => {
                      // 5 equal slices (72 degrees each)
                      const startAngle = (i * 72 * Math.PI) / 180;
                      const endAngle = ((i + 1) * 72 * Math.PI) / 180;
                      const midAngle = ((i + 0.5) * 72 * Math.PI) / 180;

                      const r = 150;
                      const cx = 150;
                      const cy = 150;

                      const x1 = cx + r * Math.cos(startAngle);
                      const y1 = cy + r * Math.sin(startAngle);
                      const x2 = cx + r * Math.cos(endAngle);
                      const y2 = cy + r * Math.sin(endAngle);

                      const textR = 96;
                      const tx = cx + textR * Math.cos(midAngle);
                      const ty = cy + textR * Math.sin(midAngle);
                      const textRot = (i + 0.5) * 72 + 90;

                      return (
                        <g key={offer.id}>
                          {/* Colored Slice Path */}
                          <path
                            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                            fill={offer.color}
                            stroke="#ffffff"
                            strokeWidth="2.5"
                          />
                          {/* Metallic Gold Peg Rivet at slice boundary */}
                          <circle cx={x2} cy={y2} r="3.5" fill="#fcd34d" stroke="#78350f" strokeWidth="1" />

                          {/* Offer Text (Crisp White with drop shadow) */}
                          <text
                            x={tx}
                            y={ty}
                            fill="#ffffff"
                            fontSize="13"
                            fontWeight="800"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(${textRot}, ${tx}, ${ty})`}
                            style={{ filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.75))" }}
                          >
                            {offer.label}
                          </text>
                        </g>
                      );
                    })}

                    {/* Wheel Center 3D Gold Hub Cap */}
                    <circle cx="150" cy="150" r="32" fill="url(#hubSpecular)" stroke="#ffffff" strokeWidth="2.5" />
                    <circle cx="150" cy="150" r="16" fill="#1e1044" />
                    <text
                      x="150"
                      y="153.5"
                      fill="#ffd700"
                      fontSize="9.5"
                      fontWeight="900"
                      letterSpacing="0.6"
                      textAnchor="middle"
                      className="select-none pointer-events-none"
                    >
                      SPIN
                    </text>
                  </svg>
                </div>
              </div>

              {/* FLOATING PRIZE CARD OVERLAY DIRECTLY ON TOP OF BLURRED WHEEL */}
              {savedData && (
                <div className="absolute inset-0 z-30 flex items-center justify-center p-2.5 sm:p-3 animate-in zoom-in-95 fade-in duration-500">
                  <div className="w-full max-w-[290px] sm:max-w-[315px] rounded-3xl bg-white/95 backdrop-blur-2xl border border-amber-300/80 p-5 sm:p-6 text-center shadow-[0_20px_50px_rgba(30,10,60,0.32),inset_0_2px_4px_rgba(255,255,255,0.95)]">
                    <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 border border-purple-200/60 px-3 py-1 rounded-full mb-2 shadow-xs">
                      🎉 Congratulations! Your Prize:
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-[#1e1044] tracking-tight drop-shadow-xs">
                      {savedData.offer.label}
                    </div>
                    <div className="text-xs text-purple-600 font-semibold mt-0.5 mb-4">
                      {savedData.offer.sublabel}
                    </div>

                    {/* Google Signup API Claim Flow */}
                    {savedData.claimed ? (
                      <div className="rounded-2xl bg-emerald-50/90 border border-emerald-300 p-3.5 text-left flex items-center gap-3 shadow-xs">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                          ✓
                        </div>
                        <div>
                          <div className="text-xs font-bold text-emerald-900 leading-tight">
                            Claimed & Saved to Account!
                          </div>
                          <div className="text-[11px] font-medium text-emerald-700 mt-0.5 leading-snug">
                            {savedData.email ? `Linked to ${savedData.email}` : "Google Account Connected"}
                          </div>
                          <div className="text-[10px] text-emerald-600/90 mt-1">
                            Your reward will apply automatically on WishForMoment at launch! ✨
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <p className="text-[11px] text-neutral-600 leading-snug">
                          Sign in with Google to save this prize to your account for launch day:
                        </p>
                        <button
                          onClick={() => loginWithGoogle()}
                          disabled={isSubmittingApi}
                          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-full bg-white hover:bg-neutral-50 text-neutral-800 font-bold text-xs border border-neutral-300 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-60"
                        >
                          {isSubmittingApi ? (
                            <div className="w-3.5 h-3.5 border-2 border-neutral-800 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                          )}
                          <span>{isSubmittingApi ? "Connecting to Google..." : "Claim & Save with Google"}</span>
                        </button>
                        {googleError && (
                          <div className="rounded-xl bg-rose-50/95 border border-rose-300/80 p-2.5 text-left flex items-start gap-2 shadow-xs animate-in fade-in duration-200">
                            <span className="text-sm shrink-0">⚠️</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-rose-900 leading-tight">
                                Cannot Claim Reward
                              </p>
                              <p className="text-[10px] text-rose-700 mt-0.5 leading-snug">
                                {googleError}
                              </p>
                              <p className="text-[9px] text-rose-600/90 mt-1 font-medium">
                                💡 Please use a new Google account that has not claimed a reward before.
                              </p>
                            </div>
                          </div>
                        )}
                        {apiSuccessMsg && (
                          <p className="text-[10px] text-emerald-600 font-semibold">{apiSuccessMsg}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ACTION AREA (BEFORE SPIN) OR STATUS FOOTER */}
            {!savedData ? (
              <div className="space-y-2">
                <button
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#6b28d9] via-[#7c3aed] to-[#8b5cf6] hover:from-[#5b21b6] hover:to-[#7c3aed] text-white font-extrabold text-sm sm:text-base shadow-[0_6px_20px_rgba(109,40,217,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer"
                >
                  {isSpinning ? "SPINNING THE WHEEL... 🎯" : "SPIN NOW TO WIN 🎁"}
                </button>
                <p className="text-[11px] text-neutral-500 font-medium">
                  Click the wheel or button to spin • One spin per dreamer
                </p>
              </div>
            ) : (
              <div className="pt-1 flex items-center justify-between text-[11px] text-neutral-500 font-medium px-2">
                <span>Reserved for launch day</span>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-purple-700 hover:text-purple-900 font-semibold underline cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
