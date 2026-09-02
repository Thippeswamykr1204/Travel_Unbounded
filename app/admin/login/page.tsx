"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/lib/validations";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const fieldStyles =
  "w-full appearance-none rounded-md border border-ink/15 bg-paper px-4 py-3 font-sans text-sm text-ink placeholder:text-ink/40 outline-none focus-visible:outline-none focus:border-2 focus:border-terra focus:px-[15px] focus:py-[11px] hover:border-ink/15";

const labelStyles = "font-sans text-sm font-medium text-ink";

export default function AdminLoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json().catch(() => null);

      if (response.ok) {
        router.push("/admin/dashboard");
        return;
      }

      setError(result?.message ?? "Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">Admin sign in</h1>
        <p className="mt-2 font-sans text-sm text-ink/70">
          Enter your credentials to access the admin dashboard.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start justify-between gap-4 rounded-md border border-terra/30 bg-terra/10 px-4 py-3 font-sans text-sm text-ink"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="text-ink/70 hover:text-ink"
            >
              ×
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mt-6 flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={labelStyles}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={fieldStyles}
              {...register("email")}
            />
            {errors.email && (
              <p className="font-sans text-xs text-terra">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className={labelStyles}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={fieldStyles}
              {...register("password")}
            />
            {errors.password && (
              <p className="font-sans text-xs text-terra">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className={cn(
              "mt-2 justify-center",
              submitting && "cursor-not-allowed opacity-60",
            )}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}