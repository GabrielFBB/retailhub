import { AppNav } from "@/components/AppNav";
import { InventoryClient } from "@/components/InventoryClient";

export default function InventoryPage() {
  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <InventoryClient />
      </main>
    </>
  );
}
