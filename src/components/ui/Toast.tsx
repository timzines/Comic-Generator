'use client';
import { useEffect } from 'react';

interface Props {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}
export function Toast({ message, type = 'success', onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  const color = type === 'success' ? 'border-accent/40 text-accent' : 'border-red-500/40 text-red-300';
  return (
    <div className={`fixed bottom-6 right-6 z-50 bg-surface border ${color} px-4 py-3 rounded-lg shadow-lg animate-slide-in`}>
      {message}
    </div>
  );
}
