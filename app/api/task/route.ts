import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_KEY = process.env.KIE_API_KEY;

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");
  const res = await axios.get(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    timeout: 30000,
  });
  return NextResponse.json(res.data);
}
