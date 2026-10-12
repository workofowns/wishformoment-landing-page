import { JsonLd } from "./JsonLd";
import { siteConfig } from "@/config/siteConfig";

/**
 * WebApplication schema — rich search snippet for the WishForMoment interactive greeting platform.
 */
export function WebApplicationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.siteName,
    url: siteConfig.url,
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    description: siteConfig.description,
    image: `${siteConfig.url}/og-image.png`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      category: "VIP Launch Early Access Reward",
    },
  };

  return <JsonLd data={data} />;
}
