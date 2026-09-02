"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyVolumePoint } from "@/types/analytics";

const TERRA = "#c1552c";
const INK = "#1c2321";

interface MonthlyVolumeChartProps {
  data: MonthlyVolumePoint[];
}

export default function MonthlyVolumeChart({ data }: MonthlyVolumeChartProps) {
  const hasData = data.some((point) => point.count > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center font-sans text-sm text-ink/50">
        Not enough data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={`${INK}1a`} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: `${INK}99`, fontSize: 12 }}
          axisLine={{ stroke: `${INK}1a` }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: `${INK}99`, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#f7f4ec",
            border: `1px solid ${INK}1a`,
            borderRadius: 8,
            fontSize: 13,
          }}
        />
        <Bar dataKey="count" fill={TERRA} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}