import type { Product } from "@/lib/mock-data";

type Props = {
  products: Product[];
  onDelete?: (id: string) => void;
  onEdit?: (product: Product) => void;
};

export function ProductTable({ products, onDelete, onEdit }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
          <tr>
            <th className="px-4 py-3 font-medium">SKU</th>
            <th className="px-4 py-3 font-medium">Produto</th>
            <th className="px-4 py-3 font-medium">Preço</th>
            <th className="px-4 py-3 font-medium">Stock</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            {(onDelete || onEdit) && <th className="px-4 py-3 font-medium">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const lowStock = p.stock < 10;
            return (
              <tr key={p.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3 text-zinc-500">{p.sku}</td>
                <td className="px-4 py-3 font-medium text-zinc-900">{p.name}</td>
                <td className="px-4 py-3">{p.price.toFixed(2)} €</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">
                  {lowStock ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Stock baixo
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      OK
                    </span>
                  )}
                </td>
                {(onDelete || onEdit) && (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(p)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(p.id)}
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Apagar
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
