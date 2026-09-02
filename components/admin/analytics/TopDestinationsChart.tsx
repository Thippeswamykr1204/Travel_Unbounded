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
import type { TopDestinationPoint } from "@/types/analytics";

const MOSS = "#5b6e52";
const INK = "#1c2321";

interface TopDestinationsChartProps {
  data: TopDestinationPoint[];
}

export default function TopDestinationsChart({ data }: TopDestinationsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center font-sans text-sm text-ink/50">
        Not enough data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={`${INK}1a`} horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: `${INK}99`, fontSize: 12 }}
          axisLine={{ stroke: `${INK}1a` }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="destination"
          width={110}
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
        <Bar dataKey="count" fill={MOSS} radius={[0, 4, 4, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}