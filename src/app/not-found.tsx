import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl font-extrabold text-accent mb-2">404</div>
      <p className="text-white/60 mb-6">This page doesn&apos;t exist.</p>
      <Link href="/dashboard" className="bg-accent text-bg font-bold px-4 py-2 rounded-lg">Back home</Link>
    </div>
  );
}
