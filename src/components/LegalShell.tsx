import type { ReactNode } from "react";
import Link from "next/link";

interface LegalShellProps {
  title: string;
  updated: string;
  children: ReactNode;
}

export default function LegalShell({
  title,
  updated,
  children,
}: LegalShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8">
      <header className="border-b pb-4 mb-6">
        <p className="text-xs text-muted-foreground">
          <Link href="/" className="underline">
            StudentNS
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Datum poslednje izmene: {updated}
        </p>
      </header>

      <div className="space-y-6 text-[15px] leading-relaxed">{children}</div>

      <footer className="mt-10 border-t pt-4 text-sm text-muted-foreground">
        <nav className="flex flex-wrap gap-4">
          <Link href="/privacy" className="underline">
            Politika privatnosti
          </Link>
          <Link href="/terms" className="underline">
            Uslovi korišćenja
          </Link>
          <Link href="/cookies" className="underline">
            Politika kolačića
          </Link>
          <Link href="/" className="underline">
            Nazad na mapu
          </Link>
        </nav>
      </footer>
    </main>
  );
}