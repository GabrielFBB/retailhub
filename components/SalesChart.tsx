import type { DailySale } from "@/lib/mock-data";

type Props = {
  sales: DailySale[];
};

export function SalesChart({ sales }: Props) {
  const max = Math.max(...sales.map((s) => s.total), 1);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex h-56 items-end justify-between gap-2">
        {sales.map((sale) => {
          const height = Math.round((sale.total / max) * 100);
          const label = sale.date.slice(5);
          return (
            <div
              key={sale.date}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
              title={`${label}: ${sale.total.toLocaleString("pt-PT")} €`}
            >
              <div
                className="w-full max-w-10 rounded-t-md bg-zinc-900 transition-all"
                style={{ height: `${height}%`, minHeight: height > 0 ? "4px" : 0 }}
              />
              <span className="text-[10px] text-zinc-500">{label}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-zinc-400">Últimos 7 dias</p>
    </div>
  );
}
