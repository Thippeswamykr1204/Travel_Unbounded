"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { EnquiryStatus } from "@/types/enquiry";
import type { StatusBreakdownPoint } from "@/types/analytics";

const STATUS_COLORS: Record<EnquiryStatus, string> = {
  new: "#2e5266", // horizon
  contacted: "#c1552c", // terra
  converted: "#5b6e52", // moss
  closed: "#1c2321", // ink
};

interface StatusBreakdownChartProps {
  data: StatusBreakdownPoint[];
}

export default function StatusBreakdownChart({ data }: StatusBreakdownChartProps) {
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
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#f7f4ec",
            border: "1px solid #1c23211a",
            borderRadius: 8,
            fontSize: 13,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-sans)", color: "#1c2321" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}