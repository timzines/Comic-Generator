import type { ComicStatus, PanelStatus } from '@/types/database';

interface Props {
  status: ComicStatus | PanelStatus;
}

const STYLES: Record<string, { bg: string; text: string; dot?: boolean; label: string }> = {
  done: { bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-300', label: 'Done' },
  generating: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-300', dot: true, label: 'Generating' },
  pending: { bg: 'bg-white/5 border-white/10', text: 'text-white/60', label: 'Pending' },
  drafting: { bg: 'bg-white/5 border-white/10', text: 'text-white/60', label: 'Drafting' },
  error: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-300', label: 'Error' },
};

export function Badge({ status }: Props) {
  const s = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs ${s.bg} ${s.text}`}>
      {s.dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {s.label}
    </span>
  );
}
