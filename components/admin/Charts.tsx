"use client";

import {
  Bar, BarChart, CartesianGrid, Cell, Funnel, FunnelChart, Line, LineChart, LabelList,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";

const tooltipStyle = {
  background: "#101d33",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 8,
  color: "#ffffff",
  fontSize: 12
};

const axisStyle = { fill: "rgba(255,255,255,0.55)", fontSize: 11 };

const statusColors: Record<string, string> = {
  New: "#60a5fa",
  "In Progress": "#c9a84c",
  Review: "#f59e0b",
  Completed: "#34d399",
  Delivered: "#a78bfa"
};

const funnelColors = ["#60a5fa", "#c9a84c", "#f59e0b", "#34d399"];

export function RevenueTrendChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="month" tick={axisStyle} axisLine={{ stroke: "rgba(255,255,255,0.12)" }} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={64} tickFormatter={(v: number) => Intl.NumberFormat("en-US", { notation: "compact" }).format(v)} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`AED ${(v as number).toLocaleString()}`, "Revenue"]} />
        <Line type="monotone" dataKey="revenue" stroke="#c9a84c" strokeWidth={2.5} dot={{ r: 3, fill: "#c9a84c" }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StatusBreakdownChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="status" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((d) => <Cell key={d.status} fill={statusColors[d.status] || "#94a3b8"} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AcquisitionFunnelChart({ data }: { data: { stage: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <FunnelChart>
        <Tooltip contentStyle={tooltipStyle} />
        <Funnel dataKey="value" data={data} isAnimationActive>
          {data.map((d, i) => <Cell key={d.stage} fill={funnelColors[i % funnelColors.length]} />)}
          <LabelList position="right" dataKey="stage" fill="#ffffff" stroke="none" fontSize={12} />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}

export function LeadsBySourceChart({ data }: { data: { source: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
        <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="source" tick={axisStyle} axisLine={false} tickLine={false} width={80} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" fill="#c9a84c" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StaffProductivityChart({ data }: { data: { staff: string; total: number; completed: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="staff" tick={axisStyle} axisLine={{ stroke: "rgba(255,255,255,0.12)" }} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="total" name="Assigned" fill="rgba(255,255,255,0.25)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="completed" name="Completed" fill="#c9a84c" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
