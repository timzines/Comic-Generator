'use client';
import Link from 'next/link';
import type { Panel } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { PlaceholderImage } from '@/components/ui/PlaceholderImage';

interface Props {
  panel: Panel;
  comicId: string;
}

export function PanelCard({ panel, comicId }: Props) {
  return (
    <Link
      href={`/comic/${comicId}/edit/${panel.id}`}
      className="group relative block bg-surface border border-white/10 rounded-lg overflow-hidden hover:border-white/30 transition"
    >
      <div className="absolute top-2 left-2 z-10 font-mono text-[10px] text-white/70 bg-black/50 px-1.5 py-0.5 rounded">
        #{String(panel.panel_index).padStart(2, '0')}
      </div>
      <div className="absolute top-2 right-2 z-10">
        <Badge status={panel.status} />
      </div>

      {panel.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={panel.image_url} alt={`Panel ${panel.panel_index}`} className="w-full aspect-video object-cover" />
      ) : (
        <PlaceholderImage aspectRatio="16/9" index={panel.panel_index} />
      )}

      {panel.status === 'generating' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <span className="w-8 h-8 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
        </div>
      )}

      <div className="p-2 text-[10px] text-white/50 line-clamp-2">{panel.prompt}</div>

      {panel.status === 'done' && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="text-xs font-semibold bg-white text-bg px-3 py-1.5 rounded">Edit panel</span>
        </div>
      )}
    </Link>
  );
}
