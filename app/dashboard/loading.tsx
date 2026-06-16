export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#eef1f5] p-5 md:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex items-center justify-between rounded-[24px] bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
          <div>
            <Shimmer className="h-4 w-40 rounded-full" />
            <Shimmer className="mt-3 h-3 w-72 max-w-full rounded-full" />
          </div>
          <Shimmer className="h-9 w-24 rounded-2xl" />
        </header>

        <section className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <Shimmer className="h-8 w-64 rounded-full" />
              <Shimmer className="mt-4 h-4 w-96 max-w-full rounded-full" />
              <div className="mt-8 flex flex-wrap gap-3">
                <Shimmer className="h-10 w-28 rounded-2xl" />
                <Shimmer className="h-10 w-28 rounded-2xl" />
                <Shimmer className="h-10 w-28 rounded-2xl" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <Shimmer key={item} className="h-24 rounded-[24px]" />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          {[0, 1, 2, 3, 4].map((item) => (
            <Shimmer key={item} className="h-32 rounded-[24px] shadow-sm ring-1 ring-black/5" />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
          <Shimmer className="h-80 rounded-[28px] shadow-sm ring-1 ring-black/5" />
          <Shimmer className="h-80 rounded-[28px] shadow-sm ring-1 ring-black/5" />
        </section>
      </div>
    </main>
  );
}

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-white ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[softShimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-slate-100 to-transparent" />
      <style>{`
        @keyframes softShimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
