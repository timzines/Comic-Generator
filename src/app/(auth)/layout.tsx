export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg grid-bg relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top, rgba(200,255,0,0.08), transparent 60%)' }} />
      <div className="relative z-10 w-full max-w-md px-6">{children}</div>
    </div>
  );
}
