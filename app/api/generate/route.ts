import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_KEY = process.env.KIE_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();
    const res = await axios.post("https://api.kie.ai/api/v1/jobs/createTask", {
      model: "google/nano-banana-edit",
      input: {
        prompt: "Redraw this portrait in Junji Ito's exact manga style: pure black and white ink, dense crosshatching, flowing ink hair strands. Preserve the original pose, composition, and facial features exactly — do not add or reveal elements not visible in the original photo. The background should vary — could be dark forest, spiraling vortex, crumbling architecture, shadowy figures, or abstract darkness. Keep the horror atmosphere through linework. Exactly like Junji Ito's Tomie or Uzumaki artwork.",
        image_urls: [imageUrl],
        output_format: "png",
        image_size: "3:4",
      },
    }, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      timeout: 30000,
    });
    return NextResponse.json(res.data);
  } catch (e) {
    console.error('generate error:', e);
    return NextResponse.json({ code: 500, msg: String(e) }, { status: 500 });
  }
}
