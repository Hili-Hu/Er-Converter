import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "missing url" }, { status: 400 });
  const res = await fetch(url);
  const blob = await res.arrayBuffer();
  return new NextResponse(blob, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "image/png",
      "Content-Disposition": 'attachment; filename="junji-ito-style.png"',
    },
  });
}
