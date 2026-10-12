import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display, Plus_Jakarta_Sans, Poppins } from "next/font/google";
import { AuthGoogleOAuthProvider } from "./components/AuthGoogleOAuthProvider";
import { siteConfig } from "@/config/siteConfig";
import { WebsiteJsonLd, OrganizationJsonLd, WebApplicationJsonLd } from "./components/seo";
import { GoogleAnalytics } from "./components/analytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7c3aed" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0a1e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.siteName,
  title: {
    default: `${siteConfig.siteName} - ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.siteName}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.siteName, url: siteConfig.url }],
  creator: siteConfig.siteName,
  publisher: siteConfig.siteName,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: `${siteConfig.siteName} - ${siteConfig.tagline}`,
    description: siteConfig.description,
    siteName: siteConfig.siteName,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.siteName} - ${siteConfig.tagline}`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitterHandle,
    creator: siteConfig.twitterHandle,
    title: `${siteConfig.siteName} - ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [{ url: siteConfig.ogImage, alt: siteConfig.siteName }],
  },
  manifest: "/manifest.json",
  category: "entertainment",
  classification: "Personalized Digital Wishes & Interactive Greeting Cards",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  ...(siteConfig.googleSiteVerification
    ? {
      verification: {
        google: siteConfig.googleSiteVerification,
      },
    }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${plusJakarta.variable} ${poppins.variable} font-poppins h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {/* Google Analytics */}
        <GoogleAnalytics gaId={siteConfig.gaId} />

        {/* Global JSON-LD structured data matching wishformoment-frontend */}
        <WebsiteJsonLd />
        <OrganizationJsonLd />
        <WebApplicationJsonLd />

        <AuthGoogleOAuthProvider>{children}</AuthGoogleOAuthProvider>
      </body>
    </html>
  );
}
