'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body className="bg-[#0a0a0f] text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold mb-2">Fatal error</h1>
          <button onClick={reset} className="bg-[#c8ff00] text-[#0a0a0f] font-bold px-4 py-2 rounded-lg mt-4">Retry</button>
        </div>
      </body>
    </html>
  );
}
