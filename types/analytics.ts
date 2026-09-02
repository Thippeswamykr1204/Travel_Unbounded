import type { EnquiryStatus } from "@/types/enquiry";

export interface MonthlyVolumePoint {
  month: string; // "2026-03"
  label: string; // "Mar 2026"
  count: number;
}

export interface StatusBreakdownPoint {
  status: EnquiryStatus;
  count: number;
  label: string;
}

export interface TopDestinationPoint {
  destination: string;
  count: number;
}

export interface AnalyticsSummary {
  monthlyVolume: MonthlyVolumePoint[];
  statusBreakdown: StatusBreakdownPoint[];
  topDestinations: TopDestinationPoint[];
  totalEnquiries: number;
  convertedCount: number;
  conversionRate: number;
}