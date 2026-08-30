"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SalesChart } from "@/components/SalesChart";
import type { DailySale, Product } from "@/lib/types";

type Alert = {
  id: string;
  name: string;
  sku: string;
  stock: number;
};

type SaleRecord = {
  id: string;
  date: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type DashboardData = {
  dailySales: DailySale[];
  totalWeek: number;
  todayTotal: number;
  lowStockCount: number;
  alerts: Alert[];
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}



export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [saleSuccess, setSaleSuccess] = useState<string | null>(null);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [saleDate, setSaleDate] = useState(todayKey());
  const [saleSubmitting, setSaleSubmitting] = useState(false);
  const [salesLog, setSalesLog] = useState<SaleRecord[]>([]);
  const [editingSale, setEditingSale] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");

  const loadDashboard = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    const json = await res.json();
    if (!res.ok) {
      throw new Error(
        typeof json.error === "string" ? json.error : "Erro ao carregar dashboard."
      );
    }
    setData(json);
  }, []);

  const loadSalesLog = useCallback(async () => {
    const res = await fetch("/api/sales");
    if (!res.ok) return;
    const json = await res.json();
    if (Array.isArray(json)) setSalesLog(json);
  }, []);

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/products");
    const json = await res.json();
    if (!res.ok) return;
    if (Array.isArray(json)) setProducts(json);
  }, []);

  useEffect(() => {
    Promise.all([loadDashboard(), loadProducts(), loadSalesLog()])
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar dashboard."
        );
      })
      .finally(() => setLoading(false));
  }, [loadDashboard, loadProducts, loadSalesLog]);

  async function handleRegisterSale(e: React.FormEvent) {
    e.preventDefault();
    setSaleError(null);
    setSaleSuccess(null);

    const qty = parseInt(quantity, 10);
    if (!productId) {
      setSaleError("Escolhe um produto.");
      return;
    }
    if (Number.isNaN(qty) || qty < 1) {
      setSaleError("Quantidade inválida.");
      return;
    }

    setSaleSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: qty, date: saleDate }),
      });
      const json = await res.json();

      if (!res.ok) {
        setSaleError(typeof json.error === "string" ? json.error : "Erro ao registar venda.");
        return;
      }

      const quando = json.date === todayKey() ? "hoje" : `em ${json.date}`;
      setSaleSuccess(
        `Venda registada ${quando}: ${json.quantity}× ${json.productName} (${Number(json.lineTotal).toFixed(2)} €).`
      );
      setQuantity("1");
      setSaleDate(todayKey());
      await loadDashboard();
      await loadProducts();
      await loadSalesLog();
    } catch {
      setSaleError("Não foi possível ligar ao servidor.");
    } finally {
      setSaleSubmitting(false);
    }
  }

  async function saveSaleEdit(id: string) {
    const qty = parseInt(editQty, 10);
    if (Number.isNaN(qty) || qty < 1) {
      setSaleError("Quantidade inválida.");
      return;
    }
    setSaleError(null);
    try {
      const res = await fetch(`/api/sales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });
      if (!res.ok) {
        const json = await res.json();
        setSaleError(typeof json.error === "string" ? json.error : "Erro ao guardar.");
        return;
      }
      setEditingSale(null);
      await loadDashboard();
      await loadProducts();
      await loadSalesLog();
    } catch {
      setSaleError("Não foi possível ligar ao servidor.");
    }
  }

  async function deleteSale(id: string) {
    if (!confirm("Apagar esta venda? O stock volta ao produto.")) return;
    setSaleError(null);
    try {
      const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setSaleError(typeof json.error === "string" ? json.error : "Erro ao apagar.");
        return;
      }
      await loadDashboard();
      await loadSalesLog();
    } catch {
      setSaleError("Não foi possível ligar ao servidor.");
    }
  }

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

      <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Registar venda</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Escolhe o produto e a quantidade. A data vem preenchida com hoje, mas podes registar uma venda de um dia anterior.
        </p>

        {saleError && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {saleError}
          </p>
        )}
        {saleSuccess && (
          <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {saleSuccess}
          </p>
        )}

        <form
          onSubmit={handleRegisterSale}
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="min-w-[200px] flex-1">
            <label htmlFor="sale-product" className="block text-sm font-medium text-zinc-700">
              Produto
            </label>
            <select
              id="sale-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="">— Escolher —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — {p.price.toFixed(2)} € · stock {p.stock}
                </option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label htmlFor="sale-qty" className="block text-sm font-medium text-zinc-700">
              Quantidade
            </label>
            <input
              id="sale-qty"
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </div>
          <div className="w-40">
            <label htmlFor="sale-date" className="block text-sm font-medium text-zinc-700">
              Data
            </label>
            <input
              id="sale-date"
              type="date"
              value={saleDate}
              max={todayKey()}
              onChange={(e) => setSaleDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </div>
          <button
            type="submit"
            disabled={saleSubmitting || products.length === 0}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
          >
            {saleSubmitting ? "A registar..." : "Registar venda"}
          </button>
        </form>

        {products.length === 0 && (
          <p className="mt-3 text-sm text-zinc-500">
            Não há produtos.{" "}
            <Link href="/inventory" className="font-medium text-zinc-900 underline">
              Adiciona no inventário
            </Link>
            .
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Vendas diárias</h2>
        <SalesChart sales={data.dailySales} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Registos de vendas</h2>
        {salesLog.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
            Ainda não há vendas registadas.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white">
            {salesLog.map((sale) => (
              <li key={sale.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900">
                    {sale.quantity}× {sale.productName}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {sale.sku} · {sale.date} · {sale.unitPrice.toFixed(2)} € cada
                  </p>
                </div>
                {editingSale === sale.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={editQty}
                      onChange={(e) => setEditQty(e.target.value)}
                      className="w-20 rounded-md border border-zinc-300 px-2 py-1 text-sm text-zinc-900"
                    />
                    <button
                      type="button"
                      onClick={() => saveSaleEdit(sale.id)}
                      className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSale(null)}
                      className="text-xs text-zinc-500 hover:text-zinc-900"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-zinc-900">
                      {sale.total.toFixed(2)} €
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSale(sale.id);
                        setEditQty(String(sale.quantity));
                      }}
                      className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSale(sale.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Apagar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
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
