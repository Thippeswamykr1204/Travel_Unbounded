"use client";

import { useEffect } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(
      error.digest
        ? `[app/error] digest=${error.digest}`
        : "[app/error] unhandled error",
      error,
    );
  }, [error]);

  return (
    <main className="flex min-h-screen items-center bg-paper">
      <Container className="py-20 text-center sm:py-28">
        <p className="font-sans text-sm font-medium uppercase tracking-wide text-terra">
          Error
        </p>
        <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
          Something went wrong
        </h1>
        <p className="mx-auto mt-4 max-w-md font-sans text-base leading-relaxed text-ink/70">
          We hit a snag loading this page. It&apos;s on us — please try
          again, or head back to the homepage.
        </p>
        <div className="mt-8 flex items-center justify-center gap-6">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/"
            className="font-sans text-sm font-medium text-terra underline-offset-4 hover:underline"
          >
            Back to home
          </Link>
        </div>
      </Container>
    </main>
  );
}