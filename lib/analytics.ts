import { getEnquiryModel } from "@/models/Enquiry";
import { STATUS_OPTIONS, type EnquiryStatus } from "@/types/enquiry";
import type {
  AnalyticsSummary,
  MonthlyVolumePoint,
  StatusBreakdownPoint,
  TopDestinationPoint,
} from "@/types/analytics";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function buildMonthRange(months: number): { month: string; label: string }[] {
  const now = new Date();
  const range: { month: string; label: string }[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const monthIndex = d.getMonth();
    const month = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    const label = `${MONTH_LABELS[monthIndex]} ${year}`;
    range.push({ month, label });
  }

  return range;
}

async function getMonthlyVolume(
  Enquiry: ReturnType<typeof getEnquiryModel>,
  months: number,
): Promise<MonthlyVolumePoint[]> {
  const range = buildMonthRange(months);
  const rangeStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - (months - 1),
    1,
  );

  const results = await Enquiry.aggregate<{ _id: string; count: number }>([
    { $match: { createdAt: { $gte: rangeStart } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const countsByMonth = new Map(results.map((r) => [r._id, r.count]));

  return range.map(({ month, label }) => ({
    month,
    label,
    count: countsByMonth.get(month) ?? 0,
  }));
}

async function getStatusBreakdown(
  Enquiry: ReturnType<typeof getEnquiryModel>,
): Promise<StatusBreakdownPoint[]> {
  const results = await Enquiry.aggregate<{ _id: EnquiryStatus; count: number }>([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const countsByStatus = new Map(results.map((r) => [r._id, r.count]));

  return STATUS_OPTIONS.map((status) => ({
    status,
    count: countsByStatus.get(status) ?? 0,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  }));
}

async function getTopDestinations(
  Enquiry: ReturnType<typeof getEnquiryModel>,
): Promise<TopDestinationPoint[]> {
  const results = await Enquiry.aggregate<{ _id: string; count: number }>([
    { $match: { destination: { $exists: true, $nin: [null, ""] } } },
    { $group: { _id: "$destination", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  return results.map((r) => ({ destination: r._id, count: r.count }));
}

async function getConversionStats(
  Enquiry: ReturnType<typeof getEnquiryModel>,
): Promise<{ totalEnquiries: number; convertedCount: number; conversionRate: number }> {
  const [totalEnquiries, convertedCount] = await Promise.all([
    Enquiry.countDocuments({}),
    Enquiry.countDocuments({ status: "converted" }),
  ]);

  const conversionRate =
    totalEnquiries === 0
      ? 0
      : Math.round((convertedCount / totalEnquiries) * 1000) / 10;

  return { totalEnquiries, convertedCount, conversionRate };
}

export async function getAnalyticsSummary(months: number): Promise<AnalyticsSummary> {
  const Enquiry = getEnquiryModel();

  const [monthlyVolume, statusBreakdown, topDestinations, conversionStats] =
    await Promise.all([
      getMonthlyVolume(Enquiry, months),
      getStatusBreakdown(Enquiry),
      getTopDestinations(Enquiry),
      getConversionStats(Enquiry),
    ]);

  return {
    monthlyVolume,
    statusBreakdown,
    topDestinations,
    ...conversionStats,
  };
}