interface Props {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}
export function Card({ children, className = '', onClick, hover }: Props) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-white/10 rounded-xl ${hover ? 'hover:border-white/30 hover:-translate-y-0.5 transition cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
