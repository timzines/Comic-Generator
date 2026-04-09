interface Props {
  label?: string;
  aspectRatio?: string;
  index?: number;
  className?: string;
}
export function PlaceholderImage({ label, aspectRatio = '16/9', index, className = '' }: Props) {
  return (
    <div
      className={`relative w-full bg-surface2 border border-white/5 overflow-hidden grid-bg flex items-center justify-center ${className}`}
      style={{ aspectRatio }}
    >
      <div className="text-white/30 text-xs font-mono">
        {index !== undefined && <span className="mr-1">#{String(index).padStart(2, '0')}</span>}
        {label ?? 'placeholder'}
      </div>
    </div>
  );
}
