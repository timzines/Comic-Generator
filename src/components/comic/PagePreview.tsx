'use client';
import { useEffect, useRef, useState } from 'react';
import type { Panel } from '@/types/database';
import { compositePage, canvasToDataUrl, canvasToBlob, type CompositePage } from '@/lib/page-compositor';
import { Button } from '@/components/ui/Button';

interface Props {
  panels: Panel[];
  pageIndex: number;
}

export function PagePreview({ panels, pageIndex }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [compositing, setCompositing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const sortedPanels = [...panels].sort((a, b) => (a.position_in_page ?? 0) - (b.position_in_page ?? 0));
  const allDone = sortedPanels.every((p) => p.status === 'done' && p.image_url);
  const pageNumber = sortedPanels[0]?.page_number ?? pageIndex + 1;

  async function handleAutoFit() {
    setCompositing(true);
    try {
      const page: CompositePage = {
        pageNumber,
        panels: sortedPanels.map((p) => ({
          imageUrl: p.image_url,
          dialog: p.dialog,
          position: p.position_in_page ?? 0,
        })),
      };
      const canvas = await compositePage(page, pageIndex);
      canvasRef.current = canvas;
      setDataUrl(canvasToDataUrl(canvas));
    } finally {
      setCompositing(false);
    }
  }

  async function handleDownload() {
    if (!canvasRef.current) return;
    const blob = await canvasToBlob(canvasRef.current);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `page-${pageNumber}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Auto-composite when all panels are done
  useEffect(() => {
    if (allDone && !dataUrl && !compositing) {
      handleAutoFit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/50">Auto-Fit Preview</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={handleAutoFit} loading={compositing} disabled={!panels.length}>
            {dataUrl ? 'Refresh' : 'Auto-Fit'}
          </Button>
          {dataUrl && (
            <Button size="sm" onClick={handleDownload}>
              Download
            </Button>
          )}
        </div>
      </div>
      <div className="bg-surface border border-white/10 rounded-lg overflow-hidden aspect-[2/3] flex items-center justify-center">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={`Page ${pageNumber} composite`} className="w-full h-full object-contain" />
        ) : (
          <div className="text-center text-white/30 text-xs px-4">
            {allDone
              ? 'Click Auto-Fit to preview'
              : 'Generate all panels to preview this page'}
          </div>
        )}
      </div>
    </div>
  );
}
