interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
export function Spinner({ size = 'md', className = '' }: Props) {
  const px = size === 'sm' ? 'w-4 h-4 border-2' : size === 'lg' ? 'w-8 h-8 border-[3px]' : 'w-5 h-5 border-2';
  return <span className={`inline-block ${px} border-white/20 border-t-accent rounded-full animate-spin ${className}`} />;
}
