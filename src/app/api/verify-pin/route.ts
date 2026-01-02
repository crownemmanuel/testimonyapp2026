import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    // Get PIN from environment variable, default to 1212
    const correctPin = process.env.TESTIMONY_PIN || "1212";

    const isValid = pin === correctPin;

    return NextResponse.json({ valid: isValid });
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid request" }, { status: 400 });
  }
}
