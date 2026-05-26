"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SalesChart } from "@/components/SalesChart";
import type { DailySale } from "@/lib/mock-data";

type Alert = {
  id: string;
  name: string;
  sku: string;
  stock: number;
};

type DashboardData = {
  dailySales: DailySale[];
  totalWeek: number;
  todayTotal: number;
  lowStockCount: number;
  alerts: Alert[];
};

function friendlyDbError(message: string) {
  if (message.includes("SEU_CLUSTER") || message.includes("ENOTFOUND")) {
    return "Ligação ao MongoDB incorreta. Verifica o .env.local e reinicia npm run dev.";
  }
  return message;
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(
            typeof json.error === "string" ? json.error : "Erro ao carregar dashboard."
          );
        }
        setData(json);
      })
      .catch((err) => {
        setError(
          friendlyDbError(err instanceof Error ? err.message : "Erro ao carregar dashboard.")
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-500">A carregar dashboard...</p>;
  }

  if (error || !data) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error ?? "Erro ao carregar dashboard."}
      </p>
    );
  }

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Vendas (7 dias)</p>
          <p className="mt-1 text-2xl font-bold">
            {data.totalWeek.toLocaleString("pt-PT")} €
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Hoje</p>
          <p className="mt-1 text-2xl font-bold">
            {data.todayTotal.toLocaleString("pt-PT")} €
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Produtos com stock baixo</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{data.lowStockCount}</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Vendas diárias</h2>
        <SalesChart sales={data.dailySales} />
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Alertas de stock</h2>
          <Link
            href="/inventory"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Ver inventário →
          </Link>
        </div>

        {data.alerts.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
            Nenhum produto com stock baixo (&lt; 10 unidades).
          </p>
        ) : (
          <ul className="space-y-2">
            {data.alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-zinc-900">{alert.name}</p>
                  <p className="text-zinc-500">{alert.sku}</p>
                </div>
                <span className="font-semibold text-amber-800">
                  {alert.stock} em stock
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
