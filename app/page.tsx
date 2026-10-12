"use client";

import { useEffect, useRef, useState } from "react";
import OfferSpinner from "./components/OfferSpinner";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [isSpinnerOpen, setIsSpinnerOpen] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        // videoRef.current.pause();
        // setIsPlaying(false);
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    // Automatically open spinner modal when video completes if spin is pending
    try {
      const saved = localStorage.getItem("wish_assigned_user_offer");
      if (!saved) {
        setTimeout(() => {
          setIsSpinnerOpen(true);
        }, 350);
      }
    } catch {
      setIsSpinnerOpen(true);
    }
  };

  // Dynamic countdown timer
  const [timeLeft, setTimeLeft] = useState({
    days: "12",
    hours: "08",
    minutes: "24",
    seconds: "36",
  });

  useEffect(() => {
    // Set countdown target to 12 days, 8 hours, 24 minutes, 36 seconds from now
    const targetDate = new Date(Date.now() + (12 * 86400 + 8 * 3600 + 24 * 60 + 36) * 1000);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;

      if (diff > 0) {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({
          days: String(d).padStart(2, "0"),
          hours: String(h).padStart(2, "0"),
          minutes: String(m).padStart(2, "0"),
          seconds: String(s).padStart(2, "0"),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const [email, setEmail] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "already_exists" | "error">("idle");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitState === "loading") return;

    setSubmitState("loading");
    setFeedbackMessage(null);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (data.status === "already_exists") {
        setSubmitState("already_exists");
        setFeedbackMessage("You are already on the VIP list! ✨");
        setTimeout(() => {
          setSubmitState("idle");
          setFeedbackMessage(null);
        }, 4500);
      } else if (data.status === "success") {
        setSubmitState("success");
        setFeedbackMessage("Seat saved! See you at launch ✨");
        setEmail("");
        setTimeout(() => {
          setSubmitState("idle");
          setFeedbackMessage(null);
        }, 4500);
      } else {
        setSubmitState("error");
        setFeedbackMessage(data.message || "Failed to save. Please try again.");
        setTimeout(() => {
          setSubmitState("idle");
          setFeedbackMessage(null);
        }, 3500);
      }
    } catch {
      setSubmitState("error");
      setFeedbackMessage("Network error. Please try again.");
      setTimeout(() => {
        setSubmitState("idle");
        setFeedbackMessage(null);
      }, 3500);
    }
  };

  const timerItems = [
    { label: "DAYS", value: timeLeft.days },
    { label: "HOURS", value: timeLeft.hours },
    { label: "MINUTES", value: timeLeft.minutes },
    { label: "SECONDS", value: timeLeft.seconds },
  ];

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden bg-cover bg-center bg-no-repeat font-[family-name:var(--font-poppins)]"
      style={{ backgroundImage: "url('/images/hero-bg.webp')" }}
    >
      {/* Immediate Poster/Fallback Background Image */}
      <img
        src="/images/hero-bg.webp"
        alt="WishForMoment - Create Personalized Digital Wishes and Invitations"
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none select-none"
      />

      {/* Background Video (Crisp, unblurred, native quality) */}
      <video
        ref={videoRef}
        poster="/images/hero-bg.webp"
        playsInline
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleVideoEnded}
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
        <source src="/videos/hero.mov" type="video/quicktime" />
        Your browser does not support the video tag.
      </video>

      {/* Semantic Accessible Content for Search Engine Crawlers */}
      <header className="sr-only">
        <p>WishForMoment — Personalized Digital Wishes, Greetings & Magical Moments</p>
      </header>
      <section className="sr-only" aria-label="About WishForMoment Platform">
        <h2>WishForMoment VIP Early Access Launch</h2>
        <p>
          WishForMoment helps you create beautiful, personalized digital wishes, invitations, and greetings. Customize and share magical moments with the people you love. Reserve your VIP seat and spin the surprise wheel to claim exclusive launch rewards.
        </p>
      </section>

      {/* Hero Layout: Left Content & Middle Right Email Capture */}
      <div className="relative z-10 w-full min-h-screen flex flex-col lg:flex-row justify-between items-start pl-5 sm:pl-14 md:pl-20 lg:pl-24 pr-5 sm:pr-8 md:pr-10 lg:pr-12 pt-10 md:pt-20 lg:pt-32 pb-16">

        {/* Left-Pinned Hero Section */}
        <div className="w-full md:w-automd:max-w-xl text-left space-y-4 select-none">
          {/* Typography */}
          <h1 className="font-[family-name:var(--font-poppins)] tracking-tight leading-[1.16]">
            <span className="block text-2xl sm:text-3xl md:text-3xl lg:text-[2.3vw]/[1.3] font-medium text-[#1e1346] drop-shadow-[0_1px_4px_rgba(255,255,255,0.6)] animate-in fade-in slide-in-from-top-3 duration-700">
              Something magical is
            </span>
            <span className="block text-[28px] sm:text-4xl md:text-4xl/[1.3] lg:text-[2.5vw]/[1.3] font-semibold bg-gradient-to-r from-[#2c1b69] via-[#7e22ce] via-[#db2777] to-[#9333ea] bg-clip-text text-transparent mt-1 drop-shadow-[0_1px_5px_rgba(255,255,255,0.4)] animate-gradient-x animate-text-glow">
              waiting to be opened...
            </span>
          </h1>

          {/* Subtitle */}
          <p className="font-[family-name:var(--font-poppins)] text-[#4a3b72] text-sm sm:text-base md:text-lg font-normal leading-relaxed max-w-md drop-shadow-[0_1px_3px_rgba(255,255,255,0.5)] pt-1 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-200">
            Every beautiful moment deserves <br className="hidden sm:inline" />
            something unforgettable.
          </p>

          {/* Water-Type Liquid Glassmorphic Countdown Timer with Staggered Infinite Float & Shimmer */}
          <div className="pt-3 sm:pt-4">
            <div className="inline-flex items-center gap-[6px]">
              {timerItems.map((item, index) => (
                <div
                  key={item.label}
                  className="flex items-center gap-[6px] animate-float-timer"
                  style={{ animationDelay: `${index * 0.28}s` }}
                >
                  {/* Liquid Water Jelly Card */}
                  <div className="relative group w-[54px] h-[58px] sm:w-[62px] sm:h-[66px] md:w-[68px] md:h-[72px] rounded-[18px] sm:rounded-[22px] flex flex-col items-center justify-center bg-gradient-to-b from-white/90 via-purple-100/60 to-purple-200/65 backdrop-blur-xl border border-white/90 shadow-[0_6px_18px_-2px_rgba(112,65,199,0.22),inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(147,51,234,0.15)] hover:scale-105 transition-all duration-300 cursor-default select-none overflow-hidden">
                    {/* Top Curved Specular Glaze (Liquid Droplet Lens) */}
                    <div className="absolute top-1 inset-x-1.5 h-3 sm:h-3.5 bg-gradient-to-b from-white/95 via-white/50 to-transparent rounded-t-[14px] sm:rounded-t-[18px] pointer-events-none" />

                    {/* Corner Specular Droplet Spot */}
                    <div className="absolute top-1.5 left-2 w-1.5 h-1.5 rounded-full bg-white blur-[0.2px] pointer-events-none" />

                    {/* Bottom Soft Reflection */}
                    <div className="absolute bottom-1 inset-x-2.5 h-1.5 bg-white/40 rounded-full blur-[1.5px] pointer-events-none" />

                    {/* Shimmer Light Reflection Sweep Across Glass */}
                    <div className="absolute inset-0 rounded-[18px] sm:rounded-[22px] overflow-hidden pointer-events-none">
                      <div
                        className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] animate-shimmer-sweep"
                        style={{ animationDelay: `${index * 0.75}s` }}
                      />
                    </div>

                    {/* Digits with Smooth Transitions */}
                    <span
                      key={item.value}
                      suppressHydrationWarning
                      className="relative z-10 text-xl sm:text-2xl md:text-[26px] font-semibold text-[#1f104d] tracking-tight leading-none drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)] animate-in fade-in zoom-in-95 duration-200"
                    >
                      {item.value}
                    </span>

                    {/* Label */}
                    <span className="relative z-10 text-[7.5px] sm:text-[8.5px] md:text-[9.5px] font-bold text-[#554585] tracking-wider uppercase mt-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
                      {item.label}
                    </span>
                  </div>

                  {/* Sparkling Diamond Separator between cards */}
                  {index < timerItems.length - 1 && (
                    <div className="flex items-center justify-center">
                      <span className="text-amber-300 text-[11px] sm:text-xs drop-shadow-[0_0_8px_rgba(251,191,36,0.95)] animate-pulse select-none">
                        ✦
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="relative w-full max-w-[340px] sm:max-w-[370px] md:max-w-[400px] mt-10">
            <form
              onSubmit={handleSubscribe}
              className="relative w-full flex items-center bg-gradient-to-b from-white/90 via-purple-100/60 to-purple-200/65 backdrop-blur-xl rounded-full p-1 sm:p-1.5 pl-3 sm:pl-4 border border-white/90 shadow-[0_8px_24px_-4px_rgba(112,65,199,0.25),inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(147,51,234,0.15)] transition-all duration-300 focus-within:shadow-[0_10px_28px_-2px_rgba(124,58,237,0.35),inset_0_2px_4px_rgba(255,255,255,0.95)]"
            >
              {/* Top Curved Specular Glaze (Liquid Droplet Lens) */}
              <div className="absolute top-0.5 inset-x-3 h-2 sm:h-2.5 bg-gradient-to-b from-white/95 via-white/50 to-transparent rounded-t-full pointer-events-none" />

              {/* Corner Specular Droplet Spot */}
              <div className="absolute top-1 left-3 w-1.5 h-1.5 rounded-full bg-white blur-[0.2px] pointer-events-none" />

              {/* Bottom Soft Reflection */}
              <div className="absolute bottom-0.5 inset-x-4 h-1 bg-white/40 rounded-full blur-[1px] pointer-events-none" />

              {/* Mail Icon */}
              <div className="text-[#554585] shrink-0 mr-2 sm:mr-2.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
                <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              {/* Email Input */}
              <input
                id="vip-email-subscribe-input"
                name="email"
                type="email"
                autoComplete="email"
                aria-label="Enter your email to save your seat for VIP early access"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email..."
                required
                className="w-full bg-transparent text-[#1f104d] placeholder-[#6b5996] text-xs sm:text-[13px] font-medium outline-none pr-2 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]"
              />

              {/* Pill Submit Button (Glossy Liquid Finish) */}
              <button
                type="submit"
                aria-label="Save my seat for VIP early access"
                disabled={submitState === "loading"}
                className={`relative flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-[11px] sm:text-xs shadow-[0_3px_10px_rgba(109,40,217,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.4)] transition-all duration-300 shrink-0 whitespace-nowrap cursor-pointer disabled:opacity-85 disabled:cursor-wait text-white ${submitState === "success"
                  ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 scale-[1.02]"
                  : submitState === "already_exists"
                    ? "bg-gradient-to-r from-[#6b28d9] via-[#7c3aed] to-[#9333ea] scale-[1.02]"
                    : submitState === "error"
                      ? "bg-gradient-to-r from-rose-600 to-pink-600"
                      : "bg-gradient-to-r from-[#6b28d9] via-[#7c3aed] to-[#8b5cf6] hover:from-[#5b21b6] hover:to-[#7c3aed] hover:scale-[1.03] active:scale-95"
                  }`}
              >
                {submitState === "loading" ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : submitState === "success" || submitState === "already_exists" ? (
                  <svg className="w-3.5 h-3.5 fill-none stroke-white stroke-[2.5]" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 fill-white shrink-0" viewBox="0 0 24 24">
                    <path d="M12 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 005 13v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-.293-.707L18 11.586V8a6 6 0 00-6-6zm-2 16a2 2 0 004 0h-4z" />
                  </svg>
                )}
                <span>
                  {submitState === "loading"
                    ? "Saving..."
                    : submitState === "success"
                      ? "Saved! ✨"
                      : submitState === "already_exists"
                        ? "Already in list! ✓"
                        : submitState === "error"
                          ? "Try Again"
                          : "Save My Seat"}
                </span>
              </button>
            </form>

            {/* Dynamic Feedback Floating Pill (Liquid Jelly Specular Style) */}
            <div
              className={`absolute top-[calc(100%+10px)] inset-x-0 sm:left-auto sm:right-0 flex justify-center sm:justify-end transition-all duration-300 ease-out pointer-events-none z-20 ${feedbackMessage
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-2 scale-95"
                }`}
            >
              {feedbackMessage && (
                <div
                  className={`relative flex items-center gap-2.5 px-4 py-2 rounded-2xl sm:rounded-full backdrop-blur-2xl border shadow-lg transition-all select-none ${submitState === "already_exists"
                    ? "bg-gradient-to-b from-white/95 via-purple-50/90 to-purple-100/85 border-white/95 text-[#24134e] shadow-[0_8px_25px_-3px_rgba(112,65,199,0.25),inset_0_1.5px_2.5px_rgba(255,255,255,0.95)]"
                    : submitState === "success"
                      ? "bg-gradient-to-b from-white/95 via-emerald-50/90 to-teal-100/85 border-white/95 text-[#064e3b] shadow-[0_8px_25px_-3px_rgba(16,185,129,0.25),inset_0_1.5px_2.5px_rgba(255,255,255,0.95)]"
                      : "bg-gradient-to-b from-white/95 via-rose-50/90 to-pink-100/85 border-white/95 text-[#881337] shadow-[0_8px_25px_-3px_rgba(225,29,72,0.25),inset_0_1.5px_2.5px_rgba(255,255,255,0.95)]"
                    }`}
                >
                  {/* Top Curved Specular Glaze */}
                  <div className="absolute top-0.5 inset-x-3 h-2 bg-gradient-to-b from-white/95 via-white/50 to-transparent rounded-t-full pointer-events-none" />

                  {/* Corner Specular Droplet */}
                  <div className="absolute top-1 left-2.5 w-1.5 h-1.5 rounded-full bg-white blur-[0.2px] pointer-events-none" />

                  {/* Status Icon Badge */}
                  <div
                    className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 text-[10px] font-bold shadow-xs ${submitState === "already_exists"
                      ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white"
                      : submitState === "success"
                        ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white"
                        : "bg-gradient-to-br from-rose-400 to-red-500 text-white"
                      }`}
                  >
                    {submitState === "already_exists" ? (
                      "✦"
                    ) : submitState === "success" ? (
                      "✓"
                    ) : (
                      "!"
                    )}
                  </div>

                  {/* Two-Line Clean Feedback Text */}
                  <div className="flex flex-col text-left leading-tight pr-1">
                    <span className="text-[12px] font-bold drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
                      {submitState === "already_exists"
                        ? "You are already on the VIP list!"
                        : submitState === "success"
                          ? "Seat saved! See you at launch ✨"
                          : feedbackMessage}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${submitState === "already_exists"
                        ? "text-[#6c5996]"
                        : submitState === "success"
                          ? "text-[#059669]"
                          : "text-[#be123c]"
                        }`}
                    >
                      {submitState === "already_exists"
                        ? "Your VIP launch invite is reserved ✨"
                        : submitState === "success"
                          ? "We'll notify you the moment we go live"
                          : "Please try again"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Gift click area + Creative Mouse Movement Indicator */}
        <div className="my-8 lg:mb-0 lg:mt-6 lg:absolute lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-20 flex flex-col items-center self-center select-none">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause background video" : "Play background video"}
            className={`group relative md:w-[24vw] md:h-[24vw] md:rounded-[50%] select-none ${!isPlaying ? "cursor-pointer" : ""}`}>
          </button>

          {/* Creative Mouse Movement & Click Indicator (Matches screenshot exactly, hidden while playing) */}
          <div
            onClick={togglePlay}
            className={`absolute -bottom-[105px] flex flex-col items-center gap-1.5 group transition-all duration-300 cursor-pointer ${isPlaying
              ? "opacity-0 pointer-events-none scale-90 translate-y-2 invisible"
              : "opacity-100 scale-100 active:scale-95 animate-float-gentle"
              }`}
          >
            {/* Exact Hand-Drawn Style Mouse Icon with Radiating Click Rays */}
            <svg
              className="w-12 h-12 sm:w-14 sm:h-14 text-[#24134e] drop-shadow-[0_1px_4px_rgba(255,255,255,0.9)] group-hover:scale-110 transition-transform duration-200"
              viewBox="0 0 52 52"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Left Radiating Click Rays */}
              <g className="animate-pulse">
                <line x1="8" y1="17" x2="13" y2="20" strokeWidth="2.4" />
                <line x1="6" y1="26" x2="12" y2="26" strokeWidth="2.4" />
                <line x1="8" y1="35" x2="13" y2="32" strokeWidth="2.4" />
              </g>

              {/* Right Radiating Click Rays */}
              <g className="animate-pulse">
                <line x1="44" y1="17" x2="39" y2="20" strokeWidth="2.4" />
                <line x1="46" y1="26" x2="40" y2="26" strokeWidth="2.4" />
                <line x1="44" y1="35" x2="39" y2="32" strokeWidth="2.4" />
              </g>

              {/* Mouse Outer Body Capsule */}
              <rect x="18" y="11" width="16" height="28" rx="8" strokeWidth="2.4" />

              {/* Top Vertical Divider between buttons */}
              <line x1="26" y1="11" x2="26" y2="22" strokeWidth="2.4" />

              {/* Horizontal Divider Line */}
              <line x1="18" y1="22" x2="34" y2="22" strokeWidth="2.4" />
            </svg>

            {/* Two-Line Prompt with subtle glow pulse */}
            <p className="font-[family-name:var(--font-poppins)] text-sm sm:text-base font-semibold tracking-wide text-[#23134e] text-center leading-tight drop-shadow-[0_1px_4px_rgba(255,255,255,0.95)] animate-pulse">
              Click the gift to <br />
              open the magic
            </p>
          </div>
        </div>
      </div>

      {/* Exclusive Launch Offer Wheel Spinner */}
      <OfferSpinner isOpen={isSpinnerOpen} onOpenChange={setIsSpinnerOpen} />
    </main>
  );
}





