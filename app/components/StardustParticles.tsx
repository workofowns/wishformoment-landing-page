"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  vy: number;
  vx: number;
  swaySpeed: number;
  swayPhase: number;
  color: string;
}

export default function StardustParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;

    // Palette of subtle stardust colors
    const colors = [
      "rgba(255, 255, 255, ",
      "rgba(245, 208, 254, ", // Soft lavender / pink
      "rgba(254, 240, 138, ", // Soft gold
      "rgba(224, 231, 255, ", // Soft starlight indigo
      "rgba(253, 230, 138, ", // Amber shimmer
    ];

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // Handle tab visibility to save battery / CPU
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Create 45 ambient stardust particles
    const particleCount = Math.min(55, Math.floor((width * height) / 28000));
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.8,
      baseAlpha: Math.random() * 0.45 + 0.25,
      alpha: 0.3,
      twinkleSpeed: Math.random() * 0.035 + 0.015,
      twinklePhase: Math.random() * Math.PI * 2,
      vy: -(Math.random() * 0.35 + 0.15), // Gentle upward drift
      vx: (Math.random() - 0.5) * 0.2,
      swaySpeed: Math.random() * 0.02 + 0.01,
      swayPhase: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Update twinkle phase
        p.twinklePhase += p.twinkleSpeed;
        const twinkleFactor = (Math.sin(p.twinklePhase) + 1) / 2; // 0 to 1
        p.alpha = p.baseAlpha * (0.35 + 0.65 * twinkleFactor);

        // Update position
        p.swayPhase += p.swaySpeed;
        p.x += p.vx + Math.sin(p.swayPhase) * 0.25;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        } else if (p.y > height + 10) {
          p.y = -10;
        }
        if (p.x < -10) {
          p.x = width + 10;
        } else if (p.x > width + 10) {
          p.x = -10;
        }

        // Render soft particle glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha.toFixed(3)})`;
        ctx.shadowColor = p.color === colors[2] ? "#fde047" : "#e879f9";
        ctx.shadowBlur = p.radius * 3.5;
        ctx.fill();

        // Extra tiny glint for brighter stars
        if (p.alpha > 0.55 && p.radius > 1.8) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, p.alpha * 1.4).toFixed(3)})`;
          ctx.fill();
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none z-5 select-none"
    />
  );
}

