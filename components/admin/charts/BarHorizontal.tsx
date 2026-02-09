'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from '@/lib/chart-theme';

interface BarHorizontalProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
}

export default function BarHorizontal({ data, height = 300 }: BarHorizontalProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-white/20 text-xs font-medium">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        <XAxis
          type="number"
          tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: CHART_COLORS.textBright, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip
          {...CHART_TOOLTIP_STYLE}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || CHART_COLORS.primary}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
