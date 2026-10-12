"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

const DEFAULT_GOOGLE_CLIENT_ID =
  "968372327472-im41oeugbvtv2731nhg187ibpgv0js77.apps.googleusercontent.com";

type Props = { children: React.ReactNode };

export function AuthGoogleOAuthProvider({ children }: Props) {
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
