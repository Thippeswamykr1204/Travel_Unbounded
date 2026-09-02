"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminShell from "@/components/admin/AdminShell";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { destinationInputSchema, type DestinationInputValues } from "@/lib/validations";
import { CATEGORY_OPTIONS, type DestinationDTO } from "@/types/destination";

const fieldStyles =
  "w-full appearance-none rounded-md border border-ink/15 bg-paper px-4 py-2.5 font-sans text-sm text-ink placeholder:text-ink/40 outline-none focus-visible:outline-none focus:border-2 focus:border-terra focus:px-[15px] focus:py-[9px] hover:border-ink/15";

const labelStyles = "font-sans text-sm font-medium text-ink";

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState<DestinationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DestinationDTO | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDestinations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/destinations", {
        credentials: "include",
      });
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Failed to load destinations.");
        return;
      }

      setDestinations(body.data);
    } catch {
      setError("Failed to load destinations.");
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect -- initial data fetch, not a render-state sync */
  useEffect(() => {
    loadDestinations();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const openCreateModal = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (destination: DestinationDTO) => {
    setEditing(destination);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSaved = (saved: DestinationDTO, isNew: boolean) => {
    setDestinations((prev) =>
      isNew ? [...prev, saved] : prev.map((d) => (d._id === saved._id ? saved : d)),
    );
    closeModal();
  };

  const handleToggleActive = async (destination: DestinationDTO) => {
    const previous = destinations;
    const nextActive = !destination.active;
    setTogglingId(destination._id);
    setDestinations((prev) =>
      prev.map((d) => (d._id === destination._id ? { ...d, active: nextActive } : d)),
    );

    try {
      const response = await fetch(`/api/admin/destinations/${destination._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ active: nextActive }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        setDestinations(previous);
        setError(body?.message ?? "Failed to update destination.");
      }
    } catch {
      setDestinations(previous);
      setError("Failed to update destination.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (destination: DestinationDTO) => {
    const confirmed = window.confirm(`Delete "${destination.name}"? This can't be undone.`);
    if (!confirmed) return;

    const previous = destinations;
    setDeletingId(destination._id);
    setDestinations((prev) => prev.filter((d) => d._id !== destination._id));

    try {
      const response = await fetch(`/api/admin/destinations/${destination._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        setDestinations(previous);
        setError(body?.message ?? "Failed to delete destination.");
      }
    } catch {
      setDestinations(previous);
      setError("Failed to delete destination.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminShell activeNav="destinations">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Destinations</h1>
          <p className="mt-2 font-sans text-sm text-ink/70">
            Manage the trips shown on the homepage.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          Add destination
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start justify-between gap-4 rounded-md border border-terra/30 bg-terra/10 px-4 py-3 font-sans text-sm text-ink"
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

      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-md bg-sand/50" />
            ))}
          </div>
        ) : destinations.length === 0 ? (
          <div className="rounded-md border border-ink/10 bg-paper px-6 py-12 text-center font-sans text-sm text-ink/60">
            No destinations yet. Add your first one.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((destination) => (
              <article
                key={destination._id}
                className={cn(
                  "flex flex-col overflow-hidden rounded-md border border-ink/10 bg-paper shadow-sm",
                  !destination.active && "opacity-60",
                )}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand/40">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin-supplied external URLs, not part of Next Image optimization pipeline */}
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="h-full w-full object-cover"
                  />
                  <span
                    className={cn(
                      "absolute right-3 top-3 rounded-sm px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-paper",
                      destination.category === "india" ? "bg-terra" : "bg-horizon",
                    )}
                  >
                    {destination.mood}
                  </span>
                  <span
                    className={cn(
                      "absolute left-3 top-3 rounded-full px-2.5 py-1 font-sans text-[10px] font-medium",
                      destination.active
                        ? "bg-moss/90 text-paper"
                        : "bg-ink/60 text-paper",
                    )}
                  >
                    {destination.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="font-display text-lg text-ink">{destination.name}</h3>
                  <p className="font-sans text-xs text-ink/60">{destination.country}</p>
                  <div className="mt-1 flex items-baseline justify-between font-sans text-sm text-ink">
                    <span>From ₹{destination.price.toLocaleString("en-IN")}</span>
                    <span className="font-mono text-xs text-ink/70">
                      {destination.duration}
                    </span>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(destination)}
                      className="rounded-full border border-ink/15 px-3 py-1.5 font-sans text-xs font-medium text-ink transition-colors hover:border-terra hover:text-terra"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(destination)}
                      disabled={togglingId === destination._id}
                      className={cn(
                        "rounded-full border border-ink/15 px-3 py-1.5 font-sans text-xs font-medium text-ink transition-colors hover:border-terra hover:text-terra",
                        togglingId === destination._id && "cursor-not-allowed opacity-60",
                      )}
                    >
                      {destination.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(destination)}
                      disabled={deletingId === destination._id}
                      className={cn(
                        "rounded-full border border-terra/30 px-3 py-1.5 font-sans text-xs font-medium text-terra transition-colors hover:bg-terra/10",
                        deletingId === destination._id && "cursor-not-allowed opacity-60",
                      )}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <DestinationFormModal
          destination={editing}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </AdminShell>
  );
}

function DestinationFormModal({
  destination,
  onClose,
  onSaved,
}: {
  destination: DestinationDTO | null;
  onClose: () => void;
  onSaved: (saved: DestinationDTO, isNew: boolean) => void;
}) {
  const isEditing = !!destination;
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DestinationInputValues>({
    resolver: zodResolver(destinationInputSchema),
    defaultValues: destination
      ? {
          name: destination.name,
          country: destination.country,
          category: destination.category,
          mood: destination.mood,
          image: destination.image,
          description: destination.description,
          price: destination.price,
          duration: destination.duration,
          active: destination.active,
        }
      : {
          name: "",
          country: "",
          category: "india",
          mood: "",
          image: "",
          description: "",
          price: 0,
          duration: "",
          active: true,
        },
  });

  const onSubmit = async (data: DestinationInputValues) => {
    setSubmitting(true);
    setFormError(null);

    try {
      const url = isEditing
        ? `/api/admin/destinations/${destination!._id}`
        : "/api/admin/destinations";
      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        setFormError(body?.message ?? "Something went wrong. Please try again.");
        return;
      }

      onSaved(body.data, !isEditing);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? "Edit destination" : "Add destination"}
      className="fixed inset-0 z-50 flex items-end justify-center bg-canvas-deep/60 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-paper p-6 shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">
            {isEditing ? "Edit destination" : "Add destination"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink/70 hover:text-ink"
          >
            ×
          </button>
        </div>

        {formError && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-terra/30 bg-terra/10 px-4 py-3 font-sans text-sm text-ink"
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className={labelStyles}>
                Name
              </label>
              <input id="name" className={fieldStyles} {...register("name")} />
              {errors.name && (
                <p className="font-sans text-xs text-terra">{errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="country" className={labelStyles}>
                Country
              </label>
              <input id="country" className={fieldStyles} {...register("country")} />
              {errors.country && (
                <p className="font-sans text-xs text-terra">{errors.country.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="category" className={labelStyles}>
                Category
              </label>
              <select id="category" className={fieldStyles} {...register("category")}>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="font-sans text-xs text-terra">{errors.category.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="mood" className={labelStyles}>
                Mood
              </label>
              <input id="mood" className={fieldStyles} {...register("mood")} />
              {errors.mood && (
                <p className="font-sans text-xs text-terra">{errors.mood.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="image" className={labelStyles}>
              Image URL
            </label>
            <input
              id="image"
              placeholder="https://…"
              className={fieldStyles}
              {...register("image")}
            />
            {errors.image && (
              <p className="font-sans text-xs text-terra">{errors.image.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className={labelStyles}>
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              className={fieldStyles}
              {...register("description")}
            />
            {errors.description && (
              <p className="font-sans text-xs text-terra">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="price" className={labelStyles}>
                Price (₹)
              </label>
              <input
                id="price"
                type="number"
                min={0}
                step={1}
                className={fieldStyles}
                {...register("price")}
              />
              {errors.price && (
                <p className="font-sans text-xs text-terra">{errors.price.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="duration" className={labelStyles}>
                Duration
              </label>
              <input
                id="duration"
                placeholder="5 Nights / 6 Days"
                className={fieldStyles}
                {...register("duration")}
              />
              {errors.duration && (
                <p className="font-sans text-xs text-terra">{errors.duration.message}</p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 font-sans text-sm text-ink">
            <input type="checkbox" {...register("active")} className="h-4 w-4" />
            Active (visible on the homepage)
          </label>

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-ink/15 px-5 py-2.5 font-sans text-sm font-medium text-ink transition-colors hover:border-terra hover:text-terra"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={submitting}
              className={cn(submitting && "cursor-not-allowed opacity-60")}
            >
              {submitting ? "Saving…" : isEditing ? "Save changes" : "Add destination"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}