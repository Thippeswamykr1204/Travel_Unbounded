"use client";

import { useEffect } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

type AdminErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: AdminErrorPageProps) {
  useEffect(() => {
    console.error(
      error.digest
        ? `[admin/error] digest=${error.digest}`
        : "[admin/error] unhandled error",
      error,
    );
  }, [error]);

  return (
    <div className="min-h-screen bg-paper">
      <Container className="flex min-h-screen flex-col items-center justify-center py-16 text-center">
        <p className="font-sans text-sm font-medium uppercase tracking-wide text-terra">
          Admin error
        </p>
        <h1 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
          Something went wrong
        </h1>
        <p className="mx-auto mt-4 max-w-md font-sans text-sm leading-relaxed text-ink/70">
          This admin page ran into a problem. Try again, or head back to the
          dashboard.
        </p>
        <div className="mt-8 flex items-center justify-center gap-6">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/admin/dashboard"
            className="font-sans text-sm font-medium text-terra underline-offset-4 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </Container>
    </div>
  );
}