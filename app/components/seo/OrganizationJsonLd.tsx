import { JsonLd } from "./JsonLd";
import { siteConfig } from "@/config/siteConfig";

/**
 * Organization schema — helps Google build a knowledge panel for WishForMoment.
 * Shows logo, contact info, and social profiles in search results.
 */
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.siteName,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/images/webp/logo.webp`,
      width: 512,
      height: 512,
    },
    description: siteConfig.description,
    email: siteConfig.supportEmail,
    foundingDate: "2024",
    sameAs: [
      "https://twitter.com/wishformoment",
      "https://www.instagram.com/wishformoment",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: siteConfig.supportEmail,
      contactType: "customer support",
      availableLanguage: ["English"],
    },
  };

  return <JsonLd data={data} />;
}
