import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://kieai.redpandaai.co");
    return NextResponse.json({ status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
