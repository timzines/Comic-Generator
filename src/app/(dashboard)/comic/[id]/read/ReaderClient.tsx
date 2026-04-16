'use client';
import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import type { Comic, Panel } from '@/types/database';
import { compositePage, canvasToBlob, canvasToDataUrl, type CompositePage } from '@/lib/page-compositor';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

interface Props { comic: Comic; panels: Panel[] }

export function ReaderClient({ comic, panels }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const [composited, setComposited] = useState<Map<number, string>>(new Map());
  const [compositing, setCompositing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canvasMapRef = useRef<Map<number, HTMLCanvasElement>>(new Map());

  // Group panels by page
  const pages = new Map<number, Panel[]>();
  for (const p of panels) {
    const pageNum = p.page_number || 1;
    const arr = pages.get(pageNum) ?? [];
    arr.push(p);
    pages.set(pageNum, arr);
  }
  const sortedPages = [...pages.entries()].sort(([a], [b]) => a - b);

  const compositeAll = useCallback(async () => {
    setCompositing(true);
    const newMap = new Map<number, string>();
    const canvases = new Map<number, HTMLCanvasElement>();

    for (const [pageNum, pagePanels] of sortedPages) {
      const sorted = [...pagePanels].sort((a, b) => (a.position_in_page ?? 0) - (b.position_in_page ?? 0));
      const page: CompositePage = {
        pageNumber: pageNum,
        panels: sorted.map((p) => ({
          imageUrl: p.image_url,
          dialog: p.dialog,
          position: p.position_in_page ?? 0,
        })),
      };
      const canvas = await compositePage(page, pageNum - 1);
      canvases.set(pageNum, canvas);
      newMap.set(pageNum, canvasToDataUrl(canvas));
    }

    canvasMapRef.current = canvases;
    setComposited(newMap);
    setCompositing(false);
  }, [sortedPages]);

  async function downloadPage(pageNum: number) {
    const canvas = canvasMapRef.current.get(pageNum);
    if (!canvas) return;
    const blob = await canvasToBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${comic.title.replace(/[^a-zA-Z0-9]/g, '_')}_page_${pageNum}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadZip() {
    setDownloading(true);
    try {
      // Dynamically import JSZip to keep bundle small
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (const [pageNum, canvas] of canvasMapRef.current.entries()) {
        const blob = await canvasToBlob(canvas);
        zip.file(`page_${String(pageNum).padStart(2, '0')}.png`, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${comic.title.replace(/[^a-zA-Z0-9]/g, '_')}_comic.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setToast('ZIP downloaded!');
    } catch {
      setToast('ZIP export failed');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href={`/comic/${comic.id}/storyboard`} className="text-white/50 text-sm hover:text-white">
          &larr; Back to Storyboard
        </Link>
        <h1 className="font-bold">{comic.title}</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={compositeAll}
            loading={compositing}
          >
            {composited.size > 0 ? 'Refresh Pages' : 'Auto-Fit All'}
          </Button>
          {composited.size > 0 && (
            <Button size="sm" onClick={downloadZip} loading={downloading}>
              Export ZIP
            </Button>
          )}
        </div>
      </div>

      {composited.size > 0 ? (
        // Composited page view
        <div className="max-w-[800px] mx-auto space-y-8 pb-16">
          {sortedPages.map(([pageNum]) => {
            const dataUrl = composited.get(pageNum);
            return (
              <div key={pageNum} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40 font-mono">Page {pageNum}</span>
                  <button
                    onClick={() => downloadPage(pageNum)}
                    className="text-xs text-accent hover:text-accent/80"
                  >
                    Download PNG
                  </button>
                </div>
                {dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={dataUrl}
                    alt={`Page ${pageNum}`}
                    className="w-full rounded-lg border border-white/10"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-surface border border-white/10 rounded-lg flex items-center justify-center text-white/30 text-sm">
                    No panels generated
                  </div>
                )}
              </div>
            );
          })}
          <div className="text-center font-mono text-white/40 pt-8">&mdash; End &mdash;</div>
        </div>
      ) : (
        // Raw panel view (fallback)
        <div className="max-w-[760px] mx-auto space-y-1 pb-16">
          <div className="text-center py-8 text-white/40 text-sm">
            Click &ldquo;Auto-Fit All&rdquo; to composite panels into manga pages with speech bubbles
          </div>
          {panels.map((p) => (
            <div key={p.id} className="relative">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt={`Panel ${p.panel_index}`} className="w-full block" />
              ) : (
                <div className="w-full aspect-video bg-surface border border-white/10 flex items-center justify-center text-white/30 text-xs">
                  Panel {p.panel_index} — not generated
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
