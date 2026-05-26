import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">RetailHub</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Entra para gerir vendas e inventário
        </p>

        <LoginForm />

      </div>
    </main>
  );
}
