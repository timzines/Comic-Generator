'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { PlaceholderImage } from '@/components/ui/PlaceholderImage';

export interface EditCanvasHandle {
  getImageData: () => string | null;
  clear: () => void;
}

interface Props { imageUrl: string | null }

type Tool = 'brush' | 'eraser';

export const EditCanvas = forwardRef<EditCanvasHandle, Props>(function EditCanvas({ imageUrl }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<Tool>('brush');
  const [size, setSize] = useState(30);
  const drawing = useRef(false);

  useImperativeHandle(ref, () => ({
    getImageData: () => canvasRef.current?.toDataURL('image/png') ?? null,
    clear: () => {
      const c = canvasRef.current; if (!c) return;
      c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    },
  }));

  useEffect(() => {
    const img = imgRef.current;
    const c = canvasRef.current;
    if (!img || !c) return;
    function resize() {
      if (!img || !c) return;
      c.width = img.clientWidth;
      c.height = img.clientHeight;
    }
    if (img.complete) resize();
    img.addEventListener('load', resize);
    window.addEventListener('resize', resize);
    return () => {
      img.removeEventListener('load', resize);
      window.removeEventListener('resize', resize);
    };
  }, [imageUrl]);

  function paint(e: React.MouseEvent) {
    const c = canvasRef.current; if (!c || !drawing.current) return;
    const rect = c.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.globalCompositeOperation = tool === 'brush' ? 'source-over' : 'destination-out';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 bg-surface border border-white/10 rounded-lg p-2">
        <button
          onClick={() => setTool('brush')}
          className={`px-3 py-1.5 text-xs rounded ${tool === 'brush' ? 'bg-accent text-bg' : 'text-white/60'}`}
        >
          ✏️ Brush
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`px-3 py-1.5 text-xs rounded ${tool === 'eraser' ? 'bg-accent text-bg' : 'text-white/60'}`}
        >
          ⌫ Eraser
        </button>
        <button
          onClick={() => {
            const c = canvasRef.current; if (!c) return;
            c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
          }}
          className="px-3 py-1.5 text-xs text-white/60"
        >
          Clear
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-white/50">Size</span>
          <input type="range" min={5} max={80} value={size} onChange={(e) => setSize(+e.target.value)} />
        </div>
      </div>

      <div className="relative bg-surface border border-white/10 rounded-lg overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={imgRef} src={imageUrl} alt="panel" className="w-full block" />
        ) : (
          <PlaceholderImage aspectRatio="16/9" />
        )}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={(e) => { drawing.current = true; paint(e); }}
          onMouseMove={paint}
          onMouseUp={() => { drawing.current = false; }}
          onMouseLeave={() => { drawing.current = false; }}
        />
      </div>
    </div>
  );
});
