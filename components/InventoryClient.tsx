"use client";

import { useCallback, useEffect, useState } from "react";
import { ProductTable } from "@/components/ProductTable";
import type { Product } from "@/lib/types";



export function InventoryClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const isEditing = editingId !== null;

  const loadProducts = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();

      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : "Erro ao carregar produtos.";
        setError(msg);
        setProducts([]);
        return;
      }

      if (!Array.isArray(data)) {
        setError("Resposta inválida da API.");
        setProducts([]);
        return;
      }

      setProducts(data);
    } catch {
      setError("Não foi possível ligar ao servidor.");
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    loadProducts().finally(() => setLoading(false));
  }, [loadProducts]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const priceNum = parseFloat(price.replace(",", "."));
    const stockNum = parseInt(stock, 10);

    if (!name.trim() || !sku.trim()) {
      setError("Preenche nome e SKU.");
      setSubmitting(false);
      return;
    }

    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("Preço inválido.");
      setSubmitting(false);
      return;
    }

    if (Number.isNaN(stockNum) || stockNum < 0) {
      setError("Stock inválido. Usa um número inteiro (ex: 10).");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim(),
          price: priceNum,
          stock: stockNum,
        }),
      });

      let data: { error?: string };
      try {
        data = await res.json();
      } catch {
        setError("Resposta inválida do servidor.");
        return;
      }

      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : "Erro ao adicionar produto.";
        setError(msg);
        return;
      }

      setName("");
      setSku("");
      setPrice("");
      setStock("");
      setShowForm(false);
      setSuccess("Produto adicionado com sucesso!");
      await loadProducts();
    } catch {
      setError("Não foi possível ligar ao servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const priceNum = parseFloat(price.replace(",", "."));
    const stockNum = parseInt(stock, 10);

    if (!name.trim() || !sku.trim()) {
      setError("Preenche nome e SKU.");
      setSubmitting(false);
      return;
    }

    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("Preço inválido.");
      setSubmitting(false);
      return;
    }

    if (Number.isNaN(stockNum) || stockNum < 0) {
      setError("Stock inválido. Usa um número inteiro (ex: 10).");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/products/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim(),
          price: priceNum,
          stock: stockNum,
        }),
      });

      const data: { error?: string } = await res.json();

      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : "Erro ao guardar alterações.";
        setError(msg);
        return;
      }

      setShowForm(false);
      setEditingId(null);
      setName("");
      setSku("");
      setPrice("");
      setStock("");
      setSuccess("Produto atualizado com sucesso!");
      await loadProducts();
    } catch {
      setError("Não foi possível ligar ao servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Apagar este produto?")) return;

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro ao apagar produto.");
        return;
      }

      setSuccess("Produto apagado.");
      await loadProducts();
    } catch {
      setError("Erro ao apagar produto.");
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventário</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {loading
              ? "A carregar..."
              : `${products.length} produto(s) na base de dados`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setSuccess(null);
            setError(null);
          }}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          {isEditing ? "Adicionar novo" : showForm ? "Fechar formulário" : "+ Adicionar produto"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={isEditing ? handleEdit : handleAdd}
          className="mt-4 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2"
        >
          <p className="text-sm text-zinc-600 sm:col-span-2">
            Preenche os campos e clica em{" "}
            <strong>{isEditing ? "Guardar alterações" : "Guardar produto"}</strong>.
          </p>
          <div>
            <label htmlFor="product-name" className="block text-sm font-medium text-zinc-700">
              Nome
            </label>
            <input
              id="product-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </div>
          <div>
            <label htmlFor="product-sku" className="block text-sm font-medium text-zinc-700">
              SKU
            </label>
            <input
              id="product-sku"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="ex: CAM-001"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </div>
          <div>
            <label htmlFor="product-price" className="block text-sm font-medium text-zinc-700">
              Preço (€)
            </label>
            <input
              id="product-price"
              required
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="19.99"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </div>
          <div>
            <label htmlFor="product-stock" className="block text-sm font-medium text-zinc-700">
              Stock (número inteiro)
            </label>
            <input
              id="product-stock"
              required
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="10"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
            >
              {submitting ? "A guardar..." : isEditing ? "Guardar alterações" : "Guardar produto"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setSuccess(null);
                setError(null);
                setName("");
                setSku("");
                setPrice("");
                setStock("");
              }}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-zinc-500">A carregar produtos...</p>
        ) : products.length === 0 && !showForm ? (
          <p className="text-sm text-zinc-500">
            Nenhum produto ainda. Clica em <strong>+ Adicionar produto</strong> para
            abrir o formulário.
          </p>
        ) : products.length === 0 ? (
          <p className="text-sm text-zinc-500">Preenche o formulário acima.</p>
        ) : (
          <ProductTable
            products={products}
            onDelete={handleDelete}
            onEdit={(p) => {
              setEditingId(p.id);
              setShowForm(true);
              setSuccess(null);
              setError(null);
              setName(p.name);
              setSku(p.sku);
              setPrice(String(p.price));
              setStock(String(p.stock));
            }}
          />
        )}
      </div>
    </>
  );
}
