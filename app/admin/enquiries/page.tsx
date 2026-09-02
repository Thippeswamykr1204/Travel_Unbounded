"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { cn } from "@/lib/utils";
import { STATUS_OPTIONS, type EnquiryDTO, type EnquiryStatus } from "@/types/enquiry";

const LIMIT = 10;

type FetchState = {
  enquiries: EnquiryDTO[];
  total: number;
  page: number;
  totalPages: number;
};

const EMPTY_STATE: FetchState = { enquiries: [], total: 0, page: 1, totalPages: 1 };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_BADGE_STYLES: Record<EnquiryStatus, string> = {
  new: "bg-horizon/10 text-horizon",
  contacted: "bg-terra/10 text-terra",
  converted: "bg-moss/10 text-moss",
  closed: "bg-ink/10 text-ink/60",
};

export default function AdminEnquiriesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<EnquiryStatus | "all">("all");
  const [page, setPage] = useState(1);

  const [state, setState] = useState<FetchState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  // debounce search input ~300ms
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handle);
  }, [search]);

  /* eslint-disable react-hooks/set-state-in-effect -- filter reset + data fetch, not a render-state sync */
  // reset to page 1 whenever the search/status filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const fetchIdRef = useRef(0);

  const loadEnquiries = useCallback(async () => {
    const requestId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (status !== "all") params.set("status", status);
    params.set("page", String(page));
    params.set("limit", String(LIMIT));

    try {
      const response = await fetch(`/api/admin/enquiries?${params.toString()}`, {
        credentials: "include",
      });
      const body = await response.json().catch(() => null);

      if (requestId !== fetchIdRef.current) return;

      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Failed to load enquiries.");
        setState(EMPTY_STATE);
        return;
      }

      setState(body.data);
    } catch {
      if (requestId !== fetchIdRef.current) return;
      setError("Failed to load enquiries.");
      setState(EMPTY_STATE);
    } finally {
      if (requestId === fetchIdRef.current) setLoading(false);
    }
  }, [debouncedSearch, status, page]);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleStatusChange = async (id: string, newStatus: EnquiryStatus) => {
    const previous = state.enquiries;
    setState((prev) => ({
      ...prev,
      enquiries: prev.enquiries.map((e) =>
        e._id === id ? { ...e, status: newStatus } : e,
      ),
    }));
    setRowErrors((prev) => ({ ...prev, [id]: "" }));

    try {
      const response = await fetch(`/api/admin/enquiry/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        setState((prev) => ({ ...prev, enquiries: previous }));
        setRowErrors((prev) => ({
          ...prev,
          [id]: body?.message ?? "Update failed.",
        }));
      }
    } catch {
      setState((prev) => ({ ...prev, enquiries: previous }));
      setRowErrors((prev) => ({ ...prev, [id]: "Update failed." }));
    }
  };

  const rangeLabel = useMemo(() => {
    if (state.total === 0) return "Showing 0 of 0";
    const start = (state.page - 1) * LIMIT + 1;
    const end = Math.min(state.page * LIMIT, state.total);
    return `Showing ${start}–${end} of ${state.total}`;
  }, [state]);

  return (
    <AdminShell activeNav="enquiries">
      <h1 className="font-display text-3xl text-ink">Enquiries</h1>
      <p className="mt-2 font-sans text-sm text-ink/70">
        Search, filter, and update enquiry statuses.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full flex-1 rounded-md border border-ink/15 bg-paper px-4 py-2.5 font-sans text-sm text-ink placeholder:text-ink/40 outline-none focus:border-2 focus:border-terra focus:px-[15px] focus:py-[9px] sm:max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as EnquiryStatus | "all")}
          className="w-full rounded-md border border-ink/15 bg-paper px-4 py-2.5 font-sans text-sm text-ink outline-none focus:border-2 focus:border-terra sm:w-48"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-terra/30 bg-terra/10 px-4 py-3 font-sans text-sm text-ink"
        >
          {error}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-md bg-sand/50"
              />
            ))}
          </div>
        ) : state.enquiries.length === 0 ? (
          <div className="rounded-md border border-ink/10 bg-paper px-6 py-12 text-center font-sans text-sm text-ink/60">
            No enquiries match your filters.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-lg border border-ink/10 md:block">
              <table className="w-full text-left font-sans text-sm">
                <thead className="bg-sand/40 text-ink/70">
                  <tr>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Travel Date</th>
                    <th className="px-4 py-3 font-medium">Travellers</th>
                    <th className="px-4 py-3 font-medium">Hotel</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {state.enquiries.map((enquiry) => (
                    <tr key={enquiry._id}>
                      <td className="px-4 py-3 text-ink">{enquiry.fullName}</td>
                      <td className="px-4 py-3 text-ink/80">
                        <div>{enquiry.email}</div>
                        <div className="text-ink/50">
                          {enquiry.countryCode} {enquiry.contactNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink/80">
                        {formatDate(enquiry.dateOfTravel)}
                      </td>
                      <td className="px-4 py-3 text-ink/80">
                        {enquiry.numberOfPeople}
                        {enquiry.numberOfChildren > 0 &&
                          ` +${enquiry.numberOfChildren} kids`}
                      </td>
                      <td className="px-4 py-3 text-ink/80">
                        {enquiry.hotelCategory}
                      </td>
                      <td className="px-4 py-3">
                        <StatusSelect
                          value={enquiry.status}
                          onChange={(next) => handleStatusChange(enquiry._id, next)}
                        />
                        {rowErrors[enquiry._id] && (
                          <p className="mt-1 text-xs text-terra">
                            {rowErrors[enquiry._id]}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink/60">
                        {formatDate(enquiry.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {state.enquiries.map((enquiry) => (
                <div
                  key={enquiry._id}
                  className="rounded-lg border border-ink/10 bg-paper p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-sans text-sm font-semibold text-ink">
                        {enquiry.fullName}
                      </p>
                      <p className="font-sans text-xs text-ink/60">
                        {enquiry.email}
                      </p>
                      <p className="font-sans text-xs text-ink/60">
                        {enquiry.countryCode} {enquiry.contactNumber}
                      </p>
                    </div>
                    <StatusSelect
                      value={enquiry.status}
                      onChange={(next) => handleStatusChange(enquiry._id, next)}
                    />
                  </div>
                  {rowErrors[enquiry._id] && (
                    <p className="mt-1 text-xs text-terra">
                      {rowErrors[enquiry._id]}
                    </p>
                  )}
                  <dl className="mt-3 grid grid-cols-2 gap-2 font-sans text-xs text-ink/70">
                    <div>
                      <dt className="text-ink/50">Travel Date</dt>
                      <dd>{formatDate(enquiry.dateOfTravel)}</dd>
                    </div>
                    <div>
                      <dt className="text-ink/50">Travellers</dt>
                      <dd>
                        {enquiry.numberOfPeople}
                        {enquiry.numberOfChildren > 0 &&
                          ` +${enquiry.numberOfChildren} kids`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink/50">Hotel</dt>
                      <dd>{enquiry.hotelCategory}</dd>
                    </div>
                    <div>
                      <dt className="text-ink/50">Created</dt>
                      <dd>{formatDate(enquiry.createdAt)}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between font-sans text-sm text-ink/70">
        <span>{rangeLabel}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={state.page <= 1 || loading}
            className={cn(
              "rounded-full border border-ink/15 px-4 py-2 font-medium text-ink transition-colors hover:border-terra hover:text-terra",
              (state.page <= 1 || loading) && "cursor-not-allowed opacity-40",
            )}
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(state.totalPages, p + 1))}
            disabled={state.page >= state.totalPages || loading}
            className={cn(
              "rounded-full border border-ink/15 px-4 py-2 font-medium text-ink transition-colors hover:border-terra hover:text-terra",
              (state.page >= state.totalPages || loading) &&
                "cursor-not-allowed opacity-40",
            )}
          >
            Next
          </button>
        </div>
      </div>
    </AdminShell>
  );
}

function StatusSelect({
  value,
  onChange,
}: {
  value: EnquiryStatus;
  onChange: (next: EnquiryStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as EnquiryStatus)}
      className={cn(
        "rounded-full border-0 px-3 py-1.5 font-sans text-xs font-medium outline-none focus:ring-2 focus:ring-terra",
        STATUS_BADGE_STYLES[value],
      )}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </option>
      ))}
    </select>
  );
}