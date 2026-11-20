/* eslint-disable react/prop-types */
import { Component } from "react";

// Catches render crashes so a bug shows a recoverable screen, not a blank page.
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("UI crashed:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <p className="eyebrow">Error</p>
        <h1 className="mt-2 font-serif text-3xl">This page tripped over itself.</h1>
        <p className="mt-3 text-ink-soft">
          Your money is safe; nothing was sent. Reload the page, and if it keeps happening,
          go back to the overview.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="h-11 rounded bg-ledger px-4 text-sm font-medium text-paper-raised hover:bg-ledger-deep"
          >
            Reload
          </button>
          <a
            href="/dashboard"
            className="inline-flex h-11 items-center rounded border border-ink px-4 text-sm font-medium hover:bg-ink hover:text-paper-raised"
          >
            Go to overview
          </a>
        </div>
      </main>
    );
  }
}
