export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="h-16 w-2/3 bg-surface rounded-lg animate-pulse mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 bg-surface rounded-xl animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-80 bg-surface rounded-xl animate-pulse" />)}
      </div>
    </div>
  );
}
