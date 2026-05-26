import { AppNav } from "@/components/AppNav";
import { DashboardClient } from "@/components/DashboardClient";

export default function DashboardPage() {
  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Resumo das vendas e alertas (dados do MongoDB)
        </p>

        <DashboardClient />
      </main>
    </>
  );
}
