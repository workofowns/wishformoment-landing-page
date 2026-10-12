import { NextResponse } from "next/server";

// In-memory fallback cache (used when GOOGLE_SHEET_WEBHOOK_URL is not yet set)
const mockSavedEmails = new Set<string>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body?.email || "").toString().trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { status: "error", message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;

    // If Google Sheet Webhook URL is configured in environment variables
    if (webhookUrl && webhookUrl.trim() !== "") {
      try {
        const googleRes = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (googleRes.ok) {
          const result = await googleRes.json();
          // Result can be { status: "already_exists" } or { status: "success" }
          return NextResponse.json(result);
        } else {
          // If Google Apps Script returns a redirect (302) or raw text
          const text = await googleRes.text();
          try {
            const parsed = JSON.parse(text);
            return NextResponse.json(parsed);
          } catch {
            // Check text response for keywords
            if (text.includes("already_exists")) {
              return NextResponse.json({
                status: "already_exists",
                message: "You are already on the list!",
              });
            }
            return NextResponse.json({
              status: "success",
              message: "Saved successfully!",
            });
          }
        }
      } catch (webhookErr) {
        console.error("Failed to call Google Sheet Webhook:", webhookErr);
        return NextResponse.json(
          {
            status: "error",
            message: "Could not connect to Google Sheets. Please check your webhook URL.",
          },
          { status: 502 }
        );
      }
    }

    // FALLBACK / DEV MODE: When GOOGLE_SHEET_WEBHOOK_URL is not yet configured in .env.local
    console.info(
      "[DEV MODE] GOOGLE_SHEET_WEBHOOK_URL is not configured yet. Saving to memory."
    );

    if (mockSavedEmails.has(email)) {
      return NextResponse.json({
        status: "already_exists",
        message: "You are already on the list!",
      });
    }

    mockSavedEmails.add(email);
    return NextResponse.json({
      status: "success",
      message: "Seat saved successfully!",
    });
  } catch (error) {
    console.error("Subscribe API error:", error);
    return NextResponse.json(
      { status: "error", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
