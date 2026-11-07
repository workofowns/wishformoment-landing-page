"use client";

import { useState, useRef, useCallback, useSyncExternalStore } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { trackEvent } from "@/lib/gtag";

const emptySubscribe = () => () => {};

let cachedRaw: string | null = null;
let cachedParsed: ClaimedData | null = null;

const getStoredOfferSnapshot = (): ClaimedData | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("wish_assigned_user_offer");
    if (raw === cachedRaw) return cachedParsed;
    cachedRaw = raw;
    cachedParsed = raw ? (JSON.parse(raw) as ClaimedData) : null;
    return cachedParsed;
  } catch {
    return null;
  }
};

const subscribeToStorage = (callback: () => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

// Standard API endpoints
export const OAUTH_GOOGLE_ENDPOINT = "/auth/oauth/google";

// Helper to map spin wheel offer to standard backend reward code
export function getRewardCodeFromOffer(offer: OfferItem): string {
  if (offer.id === 0 || offer.label.includes("Premium") || offer.label.includes("Free")) return "FREE_PREMIUM_WISH";
  if (offer.id === 1 || offer.label.includes("50%")) return "DISCOUNT_50";
  if (offer.id === 2 || offer.label.includes("80%")) return "DISCOUNT_80";
  if (offer.id === 3 || offer.label.includes("30%")) return "DISCOUNT_30";
  if (offer.id === 4 || offer.label.includes("40%")) return "DISCOUNT_40";
  return "DISCOUNT_50";
}

// 5 Curated Magical Launch Offers
export interface OfferItem {
  id: number;
  label: string;
  sublabel: string;
  badge: string;
  primaryValue: string;
  secondaryValue: string;
  icon: string;
  color: string;
  gradientStart: string;
  gradientEnd: string;
}

const OFFERS: OfferItem[] = [
  {
    id: 0,
    label: "1 Free Premium Wish",
    sublabel: "100% Free • Any Premium Wish Template On Us",
    badge: "👑 VIP GRAND PRIZE",
    primaryValue: "1 FREE",
    secondaryValue: "PREMIUM WISH",
    icon: "👑",
    color: "#e11d48",
    gradientStart: "#ff4d6d",
    gradientEnd: "#be123c",
  },
  {
    id: 1,
    label: "50% Discount",
    sublabel: "Half-Off Celebration Pass",
    badge: "50% OFF",
    primaryValue: "50%",
    secondaryValue: "OFF",
    icon: "✨",
    color: "#7c3aed",
    gradientStart: "#a855f7",
    gradientEnd: "#6b21a8",
  },
  {
    id: 2,
    label: "80% Discount",
    sublabel: "VIP Early Bird Pass",
    badge: "80% OFF",
    primaryValue: "80%",
    secondaryValue: "OFF",
    icon: "🌟",
    color: "#f59e0b",
    gradientStart: "#fbbf24",
    gradientEnd: "#d97706",
  },
  {
    id: 3,
    label: "30% Discount",
    sublabel: "Launch Celebration Gift",
    badge: "30% OFF",
    primaryValue: "30%",
    secondaryValue: "OFF",
    icon: "🪄",
    color: "#0284c7",
    gradientStart: "#38bdf8",
    gradientEnd: "#1d4ed8",
  },
  {
    id: 4,
    label: "40% Discount",
    sublabel: "Special Moment Offer",
    badge: "40% OFF",
    primaryValue: "40%",
    secondaryValue: "OFF",
    icon: "💫",
    color: "#c026d3",
    gradientStart: "#f472b6",
    gradientEnd: "#9d174d",
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

  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const storedOffer = useSyncExternalStore(subscribeToStorage, getStoredOfferSnapshot, () => null);
  const [localData, setLocalData] = useState<ClaimedData | null>(null);
  const savedData = localData || storedOffer;
  const setSavedData = setLocalData;

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
    const particles = Array.from({ length: 90 }).map(() => ({
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

    let currentT = 0;
    let interval = 55; // Initial fast ticking (ms)
    while (currentT < totalDuration - 200) {
      currentT += interval;
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
      trackEvent({
        action: "spin_wheel_win",
        category: "engagement",
        label: targetOffer.label,
      });
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

        const data = await res.json();

        // Support both direct backend response { accessToken, user, ... } and envelope { success, data: { ... } }
        const userObj = data?.user || data?.data?.user;
        const accessToken = data?.accessToken || data?.data?.accessToken;
        const isSuccess = res.ok && (Boolean(accessToken) || Boolean(userObj) || data?.success === true);

        if (isSuccess) {
          const userEmail = userObj?.email || "Google Account Connected";
          const returnedReward = userObj?.reward || data?.rewardCode || data?.data?.rewardCode || rewardKey;

          const updated: ClaimedData = {
            ...savedData,
            email: userEmail,
            claimed: true,
            rewardCode: returnedReward,
          };
          setSavedData(updated);
          try {
            localStorage.setItem("wish_assigned_user_offer", JSON.stringify(updated));
            if (accessToken) {
              localStorage.setItem("accessToken", accessToken);
            }
            const refreshToken = data?.refreshToken || data?.data?.refreshToken;
            if (refreshToken) {
              localStorage.setItem("refreshToken", refreshToken);
            }
          } catch {
            // Ignore
          }
          setApiSuccessMsg("Reward successfully applied to your account! ✨");
          trackEvent({
            action: "reward_claimed_google",
            category: "conversion",
            label: savedData.offer.label,
          });
        } else {
          const errorMsg = data?.message || data?.error?.message || data?.error || "Failed to link reward with your account.";
          setGoogleError(errorMsg);
        }
      } catch (err) {
        console.error("Failed to connect with WishForMoment backend:", err);
        setGoogleError("Connection error with server. Please try again.");
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

      {/* Floating Pill on Landing Page (Bottom Right) */}
      <div
        className="fixed bottom-3 sm:bottom-6 md:bottom-8 right-3 sm:right-6 md:right-10 z-30 select-none animate-cta-spring"
        style={{ animationDelay: "1900ms" }}
      >
        {/* Infinite Radar Glow Wave Ring */}
        {(!isMounted || !savedData) && (
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-300 via-pink-300 to-purple-400 opacity-50 blur-md animate-radar-pulse pointer-events-none" />
        )}

        {/* Live Eye-Catching "FREE SPIN" Pulsing Badge */}
        {(!isMounted || !savedData) && (
          <div className="absolute -top-2.5 sm:-top-3 right-4 sm:right-6 z-40 px-2 sm:px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 text-[8px] sm:text-[9px] font-black text-white uppercase tracking-wider shadow-[0_2px_12px_rgba(245,158,11,0.8)] border border-white/80 flex items-center gap-1 sm:gap-1.5 animate-pulse pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-200 animate-ping shrink-0" />
            <span>FREE SPIN 🎁</span>
          </div>
        )}

        <button
          onClick={() => setModalOpen(true)}
          suppressHydrationWarning
          className={`relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2.5 md:py-3 rounded-full backdrop-blur-xl border transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group overflow-hidden ${
            isMounted && savedData?.claimed
              ? "bg-emerald-50/95 border-emerald-300/80 shadow-[0_8px_25px_rgba(16,185,129,0.2)]"
              : isMounted && savedData
                ? "bg-amber-50/95 border-amber-300/80 animate-pulse shadow-[0_8px_28px_rgba(245,158,11,0.25)]"
                : "bg-white/95 hover:bg-white border-white/95 shadow-[0_8px_25px_-4px_rgba(112,65,199,0.22),inset_0_1.5px_2.5px_rgba(255,255,255,0.95)]"
            }`}
        >
          {/* Infinite Shimmer Sweep Reflection */}
          {(!isMounted || !savedData?.claimed) && (
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg] animate-shimmer-sweep" />
            </div>
          )}

          {/* 3D Spin Wheel Icon with Continuous Infinite Rotation */}
          <div className="relative w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 shrink-0 flex items-center justify-center">
            <svg
              className="w-full h-full drop-shadow-[0_2px_12px_rgba(245,158,11,0.85)] animate-slow-spin group-hover:[animation-duration:3s] transition-transform duration-700 ease-out"
              viewBox="0 0 32 32"
              fill="none"
            >
              <circle cx="16" cy="16" r="14.5" stroke="url(#miniWheelRimGrad)" strokeWidth="2.5" />
              <path d="M16 16 L30 16 A14 14 0 0 1 23 28.12 Z" fill="#e11d48" />
              <path d="M16 16 L23 28.12 A14 14 0 0 1 9 28.12 Z" fill="#7c3aed" />
              <path d="M16 16 L9 28.12 A14 14 0 0 1 2 16 Z" fill="#f59e0b" />
              <path d="M16 16 L2 16 A14 14 0 0 1 9 3.88 Z" fill="#0284c7" />
              <path d="M16 16 L9 3.88 A14 14 0 0 1 23 3.88 Z" fill="#10b981" />
              <path d="M16 16 L23 3.88 A14 14 0 0 1 30 16 Z" fill="#c026d3" />

              <circle cx="16" cy="16" r="4.5" fill="url(#miniHubGrad)" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx="16" cy="16" r="1.6" fill="#1e1044" />
              <polygon points="16,0 18.5,4 13.5,4" fill="#fbbf24" stroke="#78350f" strokeWidth="0.5" />

              <defs>
                <linearGradient id="miniWheelRimGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#fef08a" />
                  <stop offset="0.5" stopColor="#f59e0b" />
                  <stop offset="1" stopColor="#b45309" />
                </linearGradient>
                <linearGradient id="miniHubGrad" x1="13" y1="13" x2="19" y2="19" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ffffff" />
                  <stop offset="0.6" stopColor="#fcd34d" />
                  <stop offset="1" stopColor="#d97706" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Two-Line Prompt */}
          <div suppressHydrationWarning className="flex flex-col text-left leading-tight pr-1">
            <span suppressHydrationWarning className="font-[family-name:var(--font-poppins)] text-[11px] sm:text-xs md:text-[13px] font-bold text-[#1f104d]">
              {isMounted && savedData?.claimed
                ? `Saved: ${savedData.offer.label}`
                : isMounted && savedData
                  ? `You Won: ${savedData.offer.label}!`
                  : "Spin & Win a Special Surprise!"}
            </span>
            <span suppressHydrationWarning className="font-[family-name:var(--font-poppins)] text-[9px] sm:text-[10px] md:text-[11px] font-medium text-[#6b5996]">
              {isMounted && savedData?.claimed
                ? "Saved to account • View details"
                : isMounted && savedData
                  ? "Click to Claim with Google ✨"
                  : "1 Free Premium Wish or up to 80% OFF"}
            </span>
          </div>
        </button>
      </div>

      {/* REALISTIC MAGICAL FAIRY-TALE SPINNER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#14082e]/65 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-[28px] sm:rounded-[32px] bg-gradient-to-b from-white/95 via-[#faf5ff]/95 to-[#fdf2f8]/95 backdrop-blur-2xl border border-white/95 p-4 sm:p-6 md:p-7 text-neutral-900 shadow-[0_25px_80px_rgba(112,65,199,0.35),inset_0_2px_4px_rgba(255,255,255,0.95)] text-center font-[family-name:var(--font-poppins)]">
            {/* Ambient Star Sparkles */}
            <span className="absolute top-4 left-5 text-amber-400 text-xs animate-twinkle select-none pointer-events-none">✦</span>
            <span className="absolute top-12 right-6 text-purple-400 text-xs animate-twinkle select-none pointer-events-none">✦</span>
            <span className="absolute bottom-6 left-6 text-pink-400 text-xs animate-twinkle select-none pointer-events-none">✦</span>

            {/* Close Button */}
            <button
              onClick={() => setModalOpen(false)}
              aria-label="Close modal"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#554585] hover:text-[#1e1346] border border-purple-100 flex items-center justify-center transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95 z-40"
            >
              ✕
            </button>

            {/* Sparkle Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-100/90 via-purple-100/80 to-pink-100/90 border border-amber-200/80 text-amber-900 text-[10.5px] font-bold tracking-wider uppercase mb-2 shadow-xs">
              <span className="text-amber-500 animate-twinkle">✦</span>
              <span>Wheel of Magical Moments</span>
              <span className="text-amber-500 animate-twinkle">✦</span>
            </div>

            {/* Modal Title */}
            <h2 className="text-2xl sm:text-[25px] font-extrabold tracking-tight text-[#1f104d] leading-tight">
              {savedData ? "Your Special Launch Gift" : "Spin & Reveal Your Magic Gift"}
            </h2>
            <p className="text-xs sm:text-[12.5px] text-[#5c4b82] mt-1 max-w-xs mx-auto leading-relaxed">
              {savedData
                ? "This exclusive reward is reserved for your account when WishForMoment launches!"
                : "Every special moment deserves something unforgettable. Spin to unlock 1 Free Premium Wish or up to 80% discount!"}
            </p>

            {/* 3D MAGICAL WHEEL STAGE */}
            <div className="relative my-4 sm:my-5 flex items-center justify-center min-h-[285px] sm:min-h-[310px]">
              {/* Jeweled Golden Pointer / Flapper Needle */}
              <div
                className={`absolute -top-3 z-30 flex flex-col items-center transition-all duration-300 drop-shadow-[0_4px_8px_rgba(180,83,9,0.55)] ${
                  isFlapperWiggling ? "rotate-6 scale-110" : "rotate-0"
                } ${savedData ? "opacity-35 blur-[1px]" : "opacity-100"}`}
              >
                {/* Pointer Pivot Gem */}
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-200 via-rose-500 to-amber-600 border border-white shadow-xs" />
                {/* Golden Arrow Down */}
                <div className="w-0 h-0 -mt-0.5 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[18px] border-t-amber-400" />
              </div>

              {/* Outer Golden Bezel Frame with Metallic Pearls */}
              <div
                onClick={!savedData && !isSpinning ? handleSpin : undefined}
                role={!savedData && !isSpinning ? "button" : undefined}
                aria-label="Click to spin the wheel"
                title={!savedData && !isSpinning ? "Click the wheel to spin!" : undefined}
                className={`relative p-2.5 sm:p-3 rounded-full bg-gradient-to-b from-[#fef08a] via-[#f59e0b] to-[#92400e] shadow-[0_16px_40px_rgba(112,65,199,0.35),0_6px_16px_rgba(245,158,11,0.3),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-3px_5px_rgba(120,53,15,0.5)] transition-all duration-700 ${
                  savedData
                    ? "filter blur-[6px] opacity-60 scale-[0.96] pointer-events-none"
                    : isSpinning
                    ? "opacity-100 scale-100 cursor-default"
                    : "opacity-100 scale-100 cursor-pointer hover:scale-[1.02] active:scale-95 group"
                }`}
              >
                {/* Rotating Wheel Container */}
                <div
                  className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.35)]"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? "transform 4.4s cubic-bezier(0.12, 0.92, 0.22, 1)" : "none",
                  }}
                >
                  {/* SVG Wheel with 5 Enchanted Jewel Slices */}
                  <svg className="w-full h-full rounded-full" viewBox="0 0 320 320">
                    <defs>
                      {/* Gradient for Each Slice */}
                      {OFFERS.map((offer, i) => (
                        <radialGradient key={offer.id} id={`sliceGrad_${i}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={offer.gradientStart} />
                          <stop offset="100%" stopColor={offer.gradientEnd} />
                        </radialGradient>
                      ))}

                      {/* Golden Bezel Metallic Rim */}
                      <linearGradient id="goldBezel" x1="0" y1="0" x2="320" y2="320" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#fef08a" />
                        <stop offset="0.3" stopColor="#f59e0b" />
                        <stop offset="0.7" stopColor="#d97706" />
                        <stop offset="1" stopColor="#78350f" />
                      </linearGradient>

                      {/* Golden Rivet / Pearl Gradient */}
                      <radialGradient id="pearlGrad" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="40%" stopColor="#fef08a" />
                        <stop offset="100%" stopColor="#b45309" />
                      </radialGradient>

                      {/* Center Amethyst Jewel Hub */}
                      <radialGradient id="jewelHubGrad" cx="35%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#e9d5ff" />
                        <stop offset="35%" stopColor="#9333ea" />
                        <stop offset="85%" stopColor="#3b0764" />
                        <stop offset="100%" stopColor="#1e0538" />
                      </radialGradient>
                    </defs>

                    {/* Slices */}
                    {OFFERS.map((offer, i) => {
                      const startAngle = (i * 72 * Math.PI) / 180;
                      const endAngle = ((i + 1) * 72 * Math.PI) / 180;
                      const midAngle = (i * 72 + 36);

                      const cx = 160;
                      const cy = 160;
                      const r = 160;

                      const x1 = cx + r * Math.cos(startAngle);
                      const y1 = cy + r * Math.sin(startAngle);
                      const x2 = cx + r * Math.cos(endAngle);
                      const y2 = cy + r * Math.sin(endAngle);

                      return (
                        <g key={offer.id}>
                          {/* Rich Jewel Slice Path */}
                          <path
                            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                            fill={`url(#sliceGrad_${i})`}
                            stroke="#ffffff"
                            strokeWidth="2"
                            strokeOpacity="0.8"
                          />

                          {/* Outer Delicate Spoke Glow */}
                          <line
                            x1={cx}
                            y1={cy}
                            x2={x2}
                            y2={y2}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            strokeOpacity="0.7"
                          />

                          {/* Text Group Oriented Along The Spoke Ray */}
                          <g transform={`rotate(${midAngle}, ${cx}, ${cy})`}>
                            {/* Crown / Fairy Icon at outer perimeter */}
                            <text
                              x={cx + (offer.id === 0 ? 122 : 118)}
                              y={cy}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fontSize={offer.id === 0 ? "16" : "14"}
                              className="select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                            >
                              {offer.icon}
                            </text>

                            {/* Main Big Offer Text */}
                            <text
                              x={cx + (offer.id === 0 ? 74 : 80)}
                              y={cy - 4}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#ffffff"
                              fontSize={offer.id === 0 ? "14.5" : "15.5"}
                              fontWeight="900"
                              letterSpacing="0.4"
                              className="select-none pointer-events-none font-sans"
                              style={{ filter: "drop-shadow(0px 1.5px 3px rgba(0,0,0,0.65))" }}
                            >
                              {offer.primaryValue}
                            </text>

                            {/* Secondary Label (e.g. PREMIUM WISH, OFF) */}
                            <text
                              x={cx + (offer.id === 0 ? 74 : 80)}
                              y={cy + 10}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#fef08a"
                              fontSize={offer.id === 0 ? "8.6" : "10"}
                              fontWeight="800"
                              letterSpacing={offer.id === 0 ? "0.4" : "0.8"}
                              className="select-none pointer-events-none font-sans"
                              style={{ filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.6))" }}
                            >
                              {offer.secondaryValue}
                            </text>
                          </g>
                        </g>
                      );
                    })}

                    {/* Outer Golden Studs / Pearls along the border */}
                    {Array.from({ length: 20 }).map((_, idx) => {
                      const a = (idx * (360 / 20) * Math.PI) / 180;
                      const px = 160 + 153 * Math.cos(a);
                      const py = 160 + 153 * Math.sin(a);
                      return (
                        <circle
                          key={idx}
                          cx={px}
                          cy={py}
                          r="2.6"
                          fill="url(#pearlGrad)"
                          stroke="#78350f"
                          strokeWidth="0.5"
                        />
                      );
                    })}

                    {/* Center 3D Faceted Amethyst & Gold Hub Cap */}
                    <circle cx="160" cy="160" r="32" fill="url(#goldBezel)" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="160" cy="160" r="23" fill="url(#jewelHubGrad)" />
                    {/* Golden Star in Hub */}
                    <text
                      x="160"
                      y="164.5"
                      fill="#fde047"
                      fontSize="14"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="select-none pointer-events-none drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]"
                    >
                      ✦
                    </text>
                  </svg>
                </div>
              </div>

              {/* CELEBRATION PRIZE CARD OVERLAY DIRECTLY ON TOP OF BLURRED WHEEL */}
              {savedData && (
                <div className="absolute inset-0 z-30 flex items-center justify-center p-2.5 sm:p-3 animate-in zoom-in-95 fade-in duration-500">
                  <div className="w-full max-w-[295px] sm:max-w-[320px] rounded-3xl bg-white/95 backdrop-blur-2xl border border-amber-300/80 p-5 sm:p-6 text-center shadow-[0_20px_50px_rgba(112,65,199,0.32),inset_0_2px_4px_rgba(255,255,255,0.95)]">
                    <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/90 border border-amber-300/80 px-3.5 py-1 rounded-full mb-2 shadow-xs">
                      {savedData.offer.id === 0 ? "👑 VIP GRAND PRIZE UNLOCKED!" : "🎉 SPECIAL PRIZE UNLOCKED!"}
                    </span>
                    <div className="text-2xl sm:text-3xl font-black gradient-magical-text tracking-tight">
                      {savedData.offer.label}
                    </div>
                    <div className="text-xs text-[#554585] font-semibold mt-0.5 mb-4">
                      {savedData.offer.id === 0 ? "✨ Any Premium Wish Template 100% Free on Launch Day" : savedData.offer.sublabel}
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
                        <p className="text-[11px] text-[#554585] leading-snug">
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
                  className="w-full py-3 sm:py-3.5 px-6 rounded-full bg-gradient-to-r from-[#6b28d9] via-[#8b5cf6] via-[#d946ef] to-[#db2777] hover:from-[#5b21b6] hover:to-[#c026d3] text-white font-extrabold text-sm sm:text-[15px] shadow-[0_8px_25px_rgba(109,40,217,0.4),inset_0_1.5px_2px_rgba(255,255,255,0.5)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{isSpinning ? "🪄 Revealing Your Magic..." : "✨ Spin The Magic Wheel ✨"}</span>
                </button>
                <p className="text-[11px] text-[#715f94] font-medium">
                  Click the wheel or button to spin • 100% Guaranteed Launch Gift
                </p>
              </div>
            ) : (
              <div className="pt-1 flex items-center justify-between text-[11px] text-[#715f94] font-medium px-2">
                <span>Reserved for launch day</span>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
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
