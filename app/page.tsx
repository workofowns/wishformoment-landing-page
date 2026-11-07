"use client";

import { useRef, useState, Suspense } from "react";
import Image from "next/image";
import OfferSpinner from "./components/OfferSpinner";
import CountdownTimer from "./components/CountdownTimer";
import StardustParticles from "./components/StardustParticles";
import { trackEvent } from "@/lib/gtag";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpinnerOpen, setIsSpinnerOpen] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.ended) {
        videoRef.current.currentTime = 0;
      }
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // In case of browser autoplay blocking
        });
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
        trackEvent({ action: "vip_seat_already_reserved", category: "conversion" });
        setTimeout(() => {
          setSubmitState("idle");
          setFeedbackMessage(null);
        }, 4500);
      } else if (data.status === "success") {
        setSubmitState("success");
        setFeedbackMessage("Seat saved! See you at launch ✨");
        trackEvent({ action: "vip_seat_saved", category: "conversion" });
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

  return (
    <main
      className="relative h-[100dvh] max-h-[100dvh] w-[100dvw] max-w-[100dvw] overflow-hidden select-none bg-cover bg-center bg-no-repeat font-[family-name:var(--font-poppins)]"
      style={{ backgroundImage: "url('/images/hero-bg.webp')" }}
    >
      {/* Immediate Poster/Fallback Background Image */}
      <Image
        src="/images/hero-bg.webp"
        alt="WishForMoment - Create Personalized Digital Wishes and Invitations"
        fill
        priority
        sizes="100vw"
        className="object-cover z-0 pointer-events-none select-none"
      />

      {/* Background Video (Crisp, native quality) */}
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

      {/* Ambient Stardust Floating Twinkling Particles Layer */}
      <StardustParticles />

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

      {/* Hero Single-Viewport Layout (DVH & DVW fit, zero scroll) */}
      <div className="relative z-10 w-full h-[100dvh] max-h-[100dvh] flex flex-col justify-between items-start pl-4 sm:pl-8 md:pl-16 lg:pl-24 pr-4 sm:pr-8 md:pr-10 lg:pr-12 pt-3 sm:pt-6 md:pt-10 lg:pt-14 pb-3 sm:pb-6 overflow-hidden pointer-events-none">

        {/* Left Hero Content */}
        <div className="w-full max-w-sm sm:max-w-md md:max-w-xl text-left space-y-1.5 sm:space-y-2.5 md:space-y-4 select-none pointer-events-auto mt-3 md:mt-0">
          {/* Typography */}
          <h1 className="font-[family-name:var(--font-poppins)] tracking-tight leading-[1.12]">
            <span
              className="block text-xl sm:text-2xl md:text-3xl lg:text-[2.2vw]/[1.25] font-medium text-[#1e1346] drop-shadow-[0_1px_4px_rgba(255,255,255,0.6)] animate-reveal-down"
              style={{ animationDelay: "200ms" }}
            >
              Something magical is
            </span>
            <span
              className="block text-2xl sm:text-3xl md:text-4xl lg:text-[2.5vw]/[1.25] font-semibold mt-0.5 sm:mt-1 animate-reveal-scale"
              style={{ animationDelay: "450ms" }}
            >
              <span className="gradient-magical-text">
                waiting to be opened...
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="font-[family-name:var(--font-poppins)] text-[#4a3b72] text-xs sm:text-sm md:text-base font-normal leading-relaxed max-w-xs sm:max-w-md drop-shadow-[0_1px_3px_rgba(255,255,255,0.5)] animate-reveal-up"
            style={{ animationDelay: "700ms" }}
          >
            Every beautiful moment deserves <br className="hidden sm:inline" />
            something unforgettable.
          </p>

          {/* Water-Type Liquid Glassmorphic Countdown Timer (Targets Locked Future Launch Date) */}
          <Suspense
            fallback={
              <div
                className="pt-1 sm:pt-1.5 md:pt-3 opacity-0 pointer-events-none select-none h-[44px] sm:h-[54px] md:h-[70px]"
                aria-hidden="true"
              />
            }
          >
            <CountdownTimer />
          </Suspense>

          {/* VIP Early Access Email Capture Form */}
          <div
            className="relative w-full max-w-[300px] sm:max-w-[360px] md:max-w-[400px] mt-2 sm:mt-3 md:mt-5 animate-reveal-up"
            style={{ animationDelay: "1450ms" }}
          >
            <form
              onSubmit={handleSubscribe}
              className="relative w-full flex items-center bg-gradient-to-b from-white/90 via-purple-100/60 to-purple-200/65 backdrop-blur-xl rounded-full p-1 sm:p-1.5 pl-3 sm:pl-4 border border-white/90 shadow-[0_8px_24px_-4px_rgba(112,65,199,0.25),inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(147,51,234,0.15)] transition-all duration-300 focus-within:shadow-[0_10px_28px_-2px_rgba(124,58,237,0.35),inset_0_2px_4px_rgba(255,255,255,0.95)]"
            >
              {/* Top Curved Specular Glaze */}
              <div className="absolute top-0.5 inset-x-3 h-2 sm:h-2.5 bg-gradient-to-b from-white/95 via-white/50 to-transparent rounded-t-full pointer-events-none" />

              {/* Corner Specular Droplet Spot */}
              <div className="absolute top-1 left-3 w-1.5 h-1.5 rounded-full bg-white blur-[0.2px] pointer-events-none" />

              {/* Bottom Soft Reflection */}
              <div className="absolute bottom-0.5 inset-x-4 h-1 bg-white/40 rounded-full blur-[1px] pointer-events-none" />

              {/* Mail Icon */}
              <div className="text-[#554585] shrink-0 mr-2 sm:mr-2.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
                <svg className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

              {/* Pill Submit Button */}
              <button
                type="submit"
                aria-label="Save my seat for VIP early access"
                disabled={submitState === "loading"}
                className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-[11px] sm:text-xs shadow-[0_3px_10px_rgba(109,40,217,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.4)] transition-all duration-300 shrink-0 whitespace-nowrap cursor-pointer disabled:opacity-85 disabled:cursor-wait text-white ${submitState === "success"
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

            {/* Dynamic Feedback Floating Pill */}
            <div
              className={`absolute top-[calc(100%+6px)] sm:top-[calc(100%+10px)] inset-x-0 sm:left-auto sm:right-0 flex justify-center sm:justify-end transition-all duration-300 ease-out pointer-events-none z-20 ${feedbackMessage ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95"
                }`}
            >
              {feedbackMessage && (
                <div
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl sm:rounded-full backdrop-blur-2xl border shadow-lg transition-all select-none ${submitState === "already_exists"
                    ? "bg-gradient-to-b from-white/95 via-purple-50/90 to-purple-100/85 border-white/95 text-[#24134e] shadow-[0_8px_25px_-3px_rgba(112,65,199,0.25),inset_0_1.5px_2.5px_rgba(255,255,255,0.95)]"
                    : submitState === "success"
                      ? "bg-gradient-to-b from-white/95 via-emerald-50/90 to-teal-100/85 border-white/95 text-[#064e3b] shadow-[0_8px_25px_-3px_rgba(16,185,129,0.25),inset_0_1.5px_2.5px_rgba(255,255,255,0.95)]"
                      : "bg-gradient-to-b from-white/95 via-rose-50/90 to-pink-100/85 border-white/95 text-[#881337] shadow-[0_8px_25px_-3px_rgba(225,29,72,0.25),inset_0_1.5px_2.5px_rgba(255,255,255,0.95)]"
                    }`}
                >
                  {/* Status Icon Badge */}
                  <div
                    className={`flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full shrink-0 text-[9px] sm:text-[10px] font-bold shadow-xs ${submitState === "already_exists"
                      ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white"
                      : submitState === "success"
                        ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white"
                        : "bg-gradient-to-br from-rose-400 to-red-500 text-white"
                      }`}
                  >
                    {submitState === "already_exists" ? "✦" : submitState === "success" ? "✓" : "!"}
                  </div>

                  {/* Two-Line Clean Feedback Text */}
                  <div className="flex flex-col text-left leading-tight pr-1">
                    <span className="text-[11px] sm:text-[12px] font-bold drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
                      {submitState === "already_exists"
                        ? "You are already on the VIP list!"
                        : submitState === "success"
                          ? "Seat saved! See you at launch ✨"
                          : feedbackMessage}
                    </span>
                    <span
                      className={`text-[9px] sm:text-[10px] font-medium ${submitState === "already_exists"
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
        <div className="absolute top-[58%] sm:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center select-none pointer-events-none">
          {/* Main Gift Box Tap Target: completely invisible, covers gift on mobile and desktop */}
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause background video" : "Play background video"}
            className={`pointer-events-auto relative w-[62vw] h-[62vw] max-w-[240px] max-h-[240px] sm:w-[45vw] sm:h-[45vw] sm:max-w-[300px] sm:max-h-[300px] md:w-[24vw] md:h-[24vw] md:max-w-[340px] md:max-h-[340px] rounded-full select-none bg-transparent outline-none border-none focus:outline-none ${!isPlaying ? "cursor-pointer" : ""
              }`}
          />

          {/* Creative Mouse Movement & Click Indicator */}
          <div
            onClick={togglePlay}
            className={`pointer-events-auto absolute -bottom-14 sm:-bottom-16 md:-bottom-20 flex flex-col items-center gap-1 group transition-all duration-300 cursor-pointer animate-reveal-up ${isPlaying
              ? "opacity-0 pointer-events-none scale-90 translate-y-2 invisible"
              : "opacity-100 scale-100 active:scale-95 animate-float-gentle"
              }`}
            style={{ animationDelay: "1700ms" }}
          >
            {/* Exact Hand-Drawn Style Mouse Icon with Radiating Click Rays */}
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-[#24134e] drop-shadow-[0_1px_4px_rgba(255,255,255,0.9)] group-hover:scale-110 transition-transform duration-200"
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
            <p className="font-[family-name:var(--font-poppins)] text-xs sm:text-sm md:text-base font-semibold tracking-wide text-[#23134e] text-center leading-tight drop-shadow-[0_1px_4px_rgba(255,255,255,0.95)] animate-pulse">
              Click the gift to <br />
              open the magic
            </p>
          </div>
        </div>
      </div>

      {/* Exclusive Launch Offer Wheel Spinner Modal */}
      <OfferSpinner isOpen={isSpinnerOpen} onOpenChange={setIsSpinnerOpen} />
    </main>
  );
}
