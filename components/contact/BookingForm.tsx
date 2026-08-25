"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { enquirySchema, type EnquiryFormValues } from "@/lib/validations";
import PhoneField from "@/components/contact/PhoneField";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const fieldStyles =
  "w-full rounded-md border border-ink/15 bg-paper px-4 py-3 font-sans text-sm text-ink placeholder:text-ink/40 focus:border-terra";

const labelStyles = "font-sans text-sm font-medium text-ink";

function tomorrowISODate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

type BookingFormProps = {
  destination?: string;
};

export default function BookingForm({ destination }: BookingFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors },
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      fullName: "",
      countryCode: "",
      contactNumber: "",
      email: "",
      numberOfPeople: 1,
      numberOfChildren: 0,
      hotelCategory: undefined,
      destination: destination ?? "",
      companyWebsite: "",
    },
  });

  const onSubmit = async (data: EnquiryFormValues) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json().catch(() => null);

      if (response.ok) {
        setSubmitted(true);
        return;
      }

      if (response.status === 400 && result?.fieldErrors) {
        const fieldErrors = result.fieldErrors as Record<string, string[]>;
        for (const [field, messages] of Object.entries(fieldErrors)) {
          if (messages?.length) {
            setFieldError(field as keyof EnquiryFormValues, {
              type: "server",
              message: messages[0],
            });
          }
        }
        return;
      }

      setError(
        result?.message ?? "Something went wrong. Please try again.",
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    reset();
    setSubmitted(false);
    setError(null);
  };

  if (submitted) {
    return (
      <div className="rounded-md border border-ink/10 bg-sand/40 p-8 text-center sm:p-12">
        <h2 className="font-display text-2xl text-ink sm:text-3xl">
          Enquiry sent
        </h2>
        <p className="mt-3 font-sans text-base leading-relaxed text-ink/75">
          One of our travel experts will contact you within 24 hours.
        </p>
        <div className="mt-6">
          <Button type="button" onClick={handleReset}>
            Plan another journey
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start justify-between gap-4 rounded-md border border-terra/30 bg-terra/10 px-4 py-3 font-sans text-sm text-ink"
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

      {destination && (
        <p className="mb-6 font-sans text-sm text-ink/70">
          Planning a {destination} trip — noted below
        </p>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="relative flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className={labelStyles}>
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            placeholder="Your name"
            className={fieldStyles}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="font-sans text-xs text-terra">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <PhoneField register={register} errors={errors} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={labelStyles}>
            Email
          </label>
          <input
            id="email"
            type="email"
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
          <label htmlFor="dateOfTravel" className={labelStyles}>
            Date of Travel
          </label>
          <input
            id="dateOfTravel"
            type="date"
            min={tomorrowISODate()}
            className={fieldStyles}
            {...register("dateOfTravel")}
          />
          {errors.dateOfTravel && (
            <p className="font-sans text-xs text-terra">
              {errors.dateOfTravel.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="numberOfPeople" className={labelStyles}>
              Number of People
            </label>
            <input
              id="numberOfPeople"
              type="number"
              min={1}
              className={fieldStyles}
              {...register("numberOfPeople")}
            />
            {errors.numberOfPeople && (
              <p className="font-sans text-xs text-terra">
                {errors.numberOfPeople.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="numberOfChildren" className={labelStyles}>
              Number of Children
            </label>
            <input
              id="numberOfChildren"
              type="number"
              min={0}
              className={fieldStyles}
              {...register("numberOfChildren")}
            />
            {errors.numberOfChildren && (
              <p className="font-sans text-xs text-terra">
                {errors.numberOfChildren.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="hotelCategory" className={labelStyles}>
            Hotel Category
          </label>
          <select
            id="hotelCategory"
            defaultValue=""
            className={fieldStyles}
            {...register("hotelCategory")}
          >
            <option value="" disabled>
              Select a category
            </option>
            <option value="Standard">Standard</option>
            <option value="Deluxe">Deluxe</option>
            <option value="Luxury">Luxury</option>
          </select>
          {errors.hotelCategory && (
            <p className="font-sans text-xs text-terra">
              {errors.hotelCategory.message}
            </p>
          )}
        </div>

        {destination && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="destination" className={labelStyles}>
              Destination
            </label>
            <input
              id="destination"
              type="text"
              className={fieldStyles}
              {...register("destination")}
            />
          </div>
        )}

        {/* Honeypot — visually hidden off-screen, still present for screen readers.
            Must stay empty; real bots that auto-fill every field will trip it. */}
        <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="companyWebsite">Company Website</label>
          <input
            id="companyWebsite"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("companyWebsite")}
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className={cn(
            "mt-2 justify-center",
            submitting && "cursor-not-allowed opacity-60",
          )}
        >
          {submitting ? "Sending…" : "Send enquiry"}
        </Button>
      </form>
    </div>
  );
}