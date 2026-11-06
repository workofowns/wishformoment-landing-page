import { siteConfig } from "@/config/siteConfig";

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || siteConfig.gaId || "G-W889RRGH16";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Log pageview in Google Analytics
 */
export const pageview = (url: string) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

export type GTagEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: unknown;
};

/**
 * Track custom events in Google Analytics
 */
export const trackEvent = ({
  action,
  category,
  label,
  value,
  ...rest
}: GTagEvent) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", action, {
      ...(category ? { event_category: category } : {}),
      ...(label ? { event_label: label } : {}),
      ...(typeof value !== "undefined" ? { value } : {}),
      ...rest,
    });
  }
};

