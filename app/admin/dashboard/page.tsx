import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { connectDB } from "@/lib/mongodb";
import { getEnquiryModel } from "@/models/Enquiry";
import { getDestinationModel } from "@/models/Destination";
import { getAdminAuditLogModel } from "@/models/AdminAuditLog";
import { getChatConversationModel } from "@/models/ChatConversation";
import { getAnalyticsSummary } from "@/lib/analytics";
import MonthlyVolumeChart from "@/components/admin/analytics/MonthlyVolumeChart";
import StatusBreakdownChart from "@/components/admin/analytics/StatusBreakdownChart";
import TopDestinationsChart from "@/components/admin/analytics/TopDestinationsChart";

export default async function AdminDashboardPage() {
  await connectDB();
  const Enquiry = getEnquiryModel();
  const Destination = getDestinationModel();
  const AdminAuditLog = getAdminAuditLogModel();
  const ChatConversation = getChatConversationModel();

  const [total, newCount, activeDestinations, analytics, recentActivity, aiItinerariesGenerated] =
    await Promise.all([
      Enquiry.countDocuments({}),
      Enquiry.countDocuments({ status: "new" }),
      Destination.countDocuments({ active: true }),
      getAnalyticsSummary(6),
      AdminAuditLog.find({}).sort({ createdAt: -1 }).limit(10).lean(),
      ChatConversation.countDocuments({ itinerary: { $ne: null } }),
    ]);

  return (
    <AdminShell activeNav="dashboard">
      <h1 className="font-display text-3xl text-ink">Dashboard</h1>
      <p className="mt-2 font-sans text-sm text-ink/70">
        A quick snapshot of enquiries coming in.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-ink/10 bg-paper p-6 shadow-sm">
          <p className="font-sans text-sm text-ink/60">Total Enquiries</p>
          <p className="mt-2 font-display text-4xl text-ink">{total}</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-paper p-6 shadow-sm">
          <p className="font-sans text-sm text-ink/60">New Enquiries</p>
          <p className="mt-2 font-display text-4xl text-terra">{newCount}</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-paper p-6 shadow-sm">
          <p className="font-sans text-sm text-ink/60">Active Destinations</p>
          <p className="mt-2 font-display text-4xl text-moss">{activeDestinations}</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-paper p-6 shadow-sm">
          <p className="font-sans text-sm text-ink/60">Conversion Rate</p>
          <p className="mt-2 font-display text-4xl text-horizon">
            {analytics.conversionRate.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-paper p-6 shadow-sm">
          <p className="font-sans text-sm text-ink/60">AI Itineraries Generated</p>
          <p className="mt-2 font-display text-4xl text-ink">
            {aiItinerariesGenerated}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-ink/10 bg-paper p-6 shadow-sm lg:col-span-2">
          <p className="font-sans text-sm font-medium text-ink/70">
            Enquiry Volume — Last 6 Months
          </p>
          <div className="mt-4">
            <MonthlyVolumeChart data={analytics.monthlyVolume} />
          </div>
        </div>
        <div className="rounded-lg border border-ink/10 bg-paper p-6 shadow-sm">
          <p className="font-sans text-sm font-medium text-ink/70">Status Breakdown</p>
          <div className="mt-4">
            <StatusBreakdownChart data={analytics.statusBreakdown} />
          </div>
        </div>
        <div className="rounded-lg border border-ink/10 bg-paper p-6 shadow-sm lg:col-span-3">
          <p className="font-sans text-sm font-medium text-ink/70">Top Destinations</p>
          <div className="mt-4">
            <TopDestinationsChart data={analytics.topDestinations} />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-ink/10 bg-paper p-6 shadow-sm">
        <p className="font-sans text-sm font-medium text-ink/70">Recent Admin Activity</p>
        <div className="mt-4">
          {recentActivity.length === 0 ? (
            <p className="font-sans text-sm text-ink/50">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {recentActivity.map((entry) => (
                <li
                  key={String(entry._id)}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-sans text-sm text-ink">{entry.summary}</p>
                    <p className="font-sans text-xs text-ink/50">{entry.adminEmail}</p>
                  </div>
                  <p className="font-sans text-xs text-ink/50">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Link
        href="/admin/enquiries"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-terra px-6 py-3 font-sans text-sm font-medium text-paper transition-colors hover:bg-terra/90"
      >
        View all enquiries →
      </Link>
    </AdminShell>
  );
}