import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_KEY = process.env.KIE_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    let file = formData.get('file') as File;

    let blob: Blob;
    let filename = file.name || 'image.jpg';

    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || filename.toLowerCase().endsWith('.heic') || filename.toLowerCase().endsWith('.heif');

    if (isHeic) {
      const heicConvert = (await import('heic-convert')).default;
      const buffer = Buffer.from(await file.arrayBuffer());
      const jpegBuffer = await heicConvert({ buffer, format: 'JPEG', quality: 0.85 });
      blob = new Blob([jpegBuffer], { type: 'image/jpeg' });
      filename = filename.replace(/\.(heic|heif)$/i, '.jpg');
    } else {
      blob = new Blob([await file.arrayBuffer()], { type: file.type });
    }

    const uploadForm = new FormData();
    uploadForm.append('file', blob, filename);
    uploadForm.append('uploadPath', 'junji-ito');

    const res = await axios.post("https://kieai.redpandaai.co/api/file-stream-upload", uploadForm, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      timeout: 60000,
    });
    return NextResponse.json(res.data);
  } catch (e) {
    console.error('upload error:', e);
    return NextResponse.json({ success: false, msg: String(e) }, { status: 500 });
  }
}
