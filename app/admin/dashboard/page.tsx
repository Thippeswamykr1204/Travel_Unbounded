import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { connectDB } from "@/lib/mongodb";
import { getEnquiryModel } from "@/models/Enquiry";

export default async function AdminDashboardPage() {
  await connectDB();
  const Enquiry = getEnquiryModel();

  const [total, newCount] = await Promise.all([
    Enquiry.countDocuments({}),
    Enquiry.countDocuments({ status: "new" }),
  ]);

  return (
    <AdminShell activeNav="dashboard">
      <h1 className="font-display text-3xl text-ink">Dashboard</h1>
      <p className="mt-2 font-sans text-sm text-ink/70">
        A quick snapshot of enquiries coming in.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-ink/10 bg-paper p-6 shadow-sm">
          <p className="font-sans text-sm text-ink/60">Total Enquiries</p>
          <p className="mt-2 font-display text-4xl text-ink">{total}</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-paper p-6 shadow-sm">
          <p className="font-sans text-sm text-ink/60">New Enquiries</p>
          <p className="mt-2 font-display text-4xl text-terra">{newCount}</p>
        </div>
      </div>

      <p className="mt-6 font-sans text-sm text-ink/50">
        Analytics coming soon.
      </p>

      <Link
        href="/admin/enquiries"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-terra px-6 py-3 font-sans text-sm font-medium text-paper transition-colors hover:bg-terra/90"
      >
        View all enquiries →
      </Link>
    </AdminShell>
  );
}