"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/lib/errorLog";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(`ErrorBoundary:${String(info?.componentStack ?? "").slice(0, 200)}`, error);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-semibold">
            Doslo je do greske pri prikazivanju.
          </p>
          <p className="max-w-md break-words rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
            {String(this.state.error.message)}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="rounded border border-neutral-300 bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted"
          >
            Pokusaj ponovo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}