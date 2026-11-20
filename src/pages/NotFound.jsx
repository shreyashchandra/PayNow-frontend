import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";

export const NotFound = () => (
  <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
    <Logo className="mb-16" />
    <p className="num font-mono text-sm text-ink-muted">404</p>
    <h1 className="mt-2 font-serif text-4xl tracking-tight">This page isn&apos;t in the ledger.</h1>
    <p className="mt-3 text-ink-soft">The link may be old, or there might be a typo in the address.</p>
    <Link
      to="/"
      className="mt-8 inline-flex h-11 w-fit items-center rounded bg-ledger px-4 text-sm font-medium text-paper-raised hover:bg-ledger-deep"
    >
      Take me home
    </Link>
  </main>
);
