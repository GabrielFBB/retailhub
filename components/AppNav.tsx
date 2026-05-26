import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inventory", label: "Inventário" },
];

export function AppNav() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-semibold text-zinc-900">
          RetailHub
        </Link>
        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
