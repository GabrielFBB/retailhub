import type { DailySale } from "@/lib/types";

type Props = {
  sales: DailySale[];
};

export function SalesChart({ sales }: Props) {
  const max = Math.max(...sales.map((s) => s.total), 1);
  const hasSales = sales.some((s) => s.total > 0);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex h-56 items-end justify-between gap-2">
        {sales.map((sale) => {
          const height = (sale.total / max) * 100;
          const label = sale.date.slice(5);

          return (
            <div
              key={sale.date}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
              title={`${label}: ${sale.total.toLocaleString("pt-PT")} €`}
            >
              {sale.total > 0 && (
                <span className="text-[10px] font-medium text-zinc-600">
                  {Math.round(sale.total)}
                </span>
              )}
              <div
                className="w-full max-w-10 rounded-t-md bg-zinc-900 transition-all"
                style={{
                  height: sale.total > 0 ? `${Math.max(height, 3)}%` : "2px",
                  backgroundColor: sale.total > 0 ? undefined : "#e4e4e7",
                }}
              />
              <span className="text-[10px] text-zinc-500">{label}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-zinc-400">
        {hasSales ? "Ultimos 7 dias" : "Sem vendas nos ultimos 7 dias"}
      </p>
    </div>
  );
}
