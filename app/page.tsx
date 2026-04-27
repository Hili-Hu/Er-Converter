"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Ghost, Zap } from 'lucide-react';
import { GooeyText } from '@/components/gooey-text';
import { BackgroundGradientAnimation } from '@/components/background-gradient-animation';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

type State = 'idle' | 'cropping' | 'uploading' | 'generating' | 'done' | 'error';

async function getCroppedBlob(imageSrc: string, cropArea: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.src = imageSrc;
  });
  const canvas = document.createElement('canvas');
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;
  canvas.getContext('2d')!.drawImage(img, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, cropArea.width, cropArea.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85));
}

export default function JunjiItoConverter() {
  const [isHovering, setIsHovering] = useState(false);
  const [state, setState] = useState<State>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target!.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setState('cropping');
    };
    reader.readAsDataURL(file);
  }

  async function handleConfirm() {
    if (!preview || !croppedArea) return;
    doneRef.current = false;
    setState('uploading');
    setError(null);
    setResult(null);

    try {
      const blob = await getCroppedBlob(preview, croppedArea);
      const formData = new FormData();
      formData.append('file', blob, 'image.jpg');
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.msg || 'Upload failed');
      const imageUrl = uploadData.data.downloadUrl;

      setState('generating');
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      const genData = await genRes.json();
      if (genData.code !== 200) throw new Error(genData.msg || 'Generation failed');
      const taskId = genData.data.taskId;

      let attempts = 0;
      while (attempts < 60) {
        await new Promise((r) => setTimeout(r, 5000));
        const taskRes = await fetch(`/api/task?taskId=${taskId}`);
        const taskData = await taskRes.json();
        const { state: taskState, resultJson, failMsg } = taskData.data;
        if (taskState === 'success') {
          if (doneRef.current) return;
          doneRef.current = true;
          const { resultUrls } = JSON.parse(resultJson);
          setResult(resultUrls[0]);
          setState('done');
          return;
        }
        if (taskState === 'fail') throw new Error(failMsg || 'Generation failed');
        attempts++;
      }
      throw new Error('Timeout: generation took too long');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setState('error');
    }
  }

  async function handleDownload() {
    if (!result) return;
    const a = document.createElement('a');
    a.href = `/api/download?url=${encodeURIComponent(result)}`;
    a.download = 'junji-ito-style.png';
    a.click();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  const isProcessing = state === 'uploading' || state === 'generating';
  const statusText = state === 'uploading' ? '上传中...' : '转化中，请稍候...';

  return (
    <BackgroundGradientAnimation containerClassName="min-h-screen" className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 overflow-y-auto">
    <main className="w-full text-[#f5f5f5] flex flex-col items-center justify-center selection:bg-white selection:text-black">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] border-[1px] border-white rounded-full animate-[spin_60s_linear_infinite]"
          style={{ backgroundImage: 'radial-gradient(circle, transparent 30%, white 31%, transparent 32%)', backgroundSize: '100px 100px' }} />
      </div>

      <header className="mb-16 text-center z-10 pt-24">
        <GooeyText
          texts={["JUNJI ITO STYLE", "HORROR MANGA", "SPIRAL INTO DARKNESS", "TOMIE REBORN"]}
          morphTime={1.5}
          cooldownTime={2}
          className="h-40 md:h-48 w-full overflow-visible"
          textClassName="font-serif tracking-tighter italic text-[#f5f5f5]"
        />
        <p className="text-sm tracking-[0.3em] uppercase opacity-50 font-light mt-4">
          转化为你深处的恐惧与美
        </p>
      </header>

      <div className="w-full max-w-2xl flex flex-col md:flex-row gap-6 z-10">
        {/* Upload / Crop panel */}
        <section className="relative w-full md:w-1/2 aspect-[3/4] border border-[#333] bg-[#0a0a0a] overflow-hidden"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}>

          {state === 'cropping' && preview ? (
            <>
              <Cropper
                image={preview}
                crop={crop}
                zoom={zoom}
                aspect={3 / 4}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{ containerStyle: { background: '#0a0a0a' } }}
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 z-10">
                <button onClick={() => { setState('idle'); setPreview(null); }}
                  className="text-[10px] tracking-widest border border-[#555] px-4 py-2 hover:border-white transition-colors bg-black/80">
                  重选
                </button>
                <button onClick={handleConfirm}
                  className="text-[10px] tracking-widest border border-white px-4 py-2 hover:bg-white hover:text-black transition-colors bg-black/80">
                  确认生成
                </button>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer group"
              onClick={() => !isProcessing && inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}>
              <input ref={inputRef} type="file" accept="image/*,.heic,.heif" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[#333] group-hover:border-[#f5f5f5] transition-colors" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[#333] group-hover:border-[#f5f5f5] transition-colors" />

              {isProcessing && preview ? (
                <img src={preview} alt="preview" className="absolute inset-0 w-full h-full object-cover opacity-40" />
              ) : (
                <div className={`flex flex-col items-center transition-all duration-500 ${isHovering ? 'scale-110' : 'scale-100'}`}>
                  <Upload className={`w-12 h-12 mb-6 transition-all ${isHovering ? 'animate-pulse text-white' : 'text-[#333]'}`} strokeWidth={1} />
                  <span className="text-xs tracking-widest font-light opacity-40 group-hover:opacity-100 transition-opacity">
                    {isHovering ? '点击上传你的肖像...' : 'UPLOAD PORTRAIT'}
                  </span>
                </div>
              )}

              {isHovering && !preview && (
                <div className="absolute inset-0 pointer-events-none opacity-10 flex items-center justify-center">
                  <span className="text-[10rem] font-serif italic select-none">螺旋</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Result panel */}
        <section className="relative w-full md:w-1/2 aspect-[3/4] border border-[#333] bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[#333]" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[#333]" />

          {isProcessing && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border border-white rounded-full animate-spin border-t-transparent" />
              <span className="text-xs tracking-widest opacity-60">{statusText}</span>
            </div>
          )}
          {state === 'done' && result && (
            <img src={result} alt="result" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          )}
          {state === 'error' && (
            <div className="flex flex-col items-center gap-2 px-6 text-center">
              <span className="text-xs text-red-400 tracking-widest">ERROR</span>
              <p className="text-[10px] opacity-60">{error}</p>
            </div>
          )}
          {(state === 'idle' || state === 'cropping') && (
            <span className="text-xs tracking-widest opacity-20">RESULT</span>
          )}
        </section>
      </div>

      {state === 'done' && result && (
        <button onClick={handleDownload} className="mt-8 z-10 text-xs tracking-widest border border-[#333] px-6 py-3 hover:border-white transition-colors">
          DOWNLOAD
        </button>
      )}

      <footer className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 max-w-2xl text-center opacity-40 hover:opacity-100 transition-opacity duration-1000">
        <div className="space-y-2">
          <Ghost className="w-5 h-5 mx-auto mb-2" strokeWidth={1} />
          <h3 className="text-xs tracking-widest font-bold">富江模式</h3>
          <p className="text-[10px] leading-relaxed">捕捉那颗标志性的泪痣与致命的吸引力</p>
        </div>
        <div className="space-y-2">
          <Zap className="w-5 h-5 mx-auto mb-2" strokeWidth={1} />
          <h3 className="text-xs tracking-widest font-bold">排线阴影</h3>
          <p className="text-[10px] leading-relaxed">手工质感的密集线条，还原大师笔触</p>
        </div>
        <div className="space-y-2">
          <div className="w-5 h-5 border border-white rounded-full mx-auto mb-2 flex items-center justify-center text-[8px]">◎</div>
          <h3 className="text-xs tracking-widest font-bold">黑涡镇</h3>
          <p className="text-[10px] leading-relaxed">瞳孔与背景的非线性螺旋异化</p>
        </div>
      </footer>
      <p className="mt-8 mb-4 text-[10px] opacity-40 text-center z-10">
        有问题或建议？联系我们：<a href="mailto:feedback@bestskills.top" className="underline">feedback@bestskills.top</a>
      </p>
    </main>
    </BackgroundGradientAnimation>
  );
}
