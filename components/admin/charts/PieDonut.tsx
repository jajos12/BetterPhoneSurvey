'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CHART_TOOLTIP_STYLE, CHART_COLORS } from '@/lib/chart-theme';

interface PieDonutProps {
  data: Array<{ name: string; value: number; color: string }>;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export default function PieDonut({ data, height = 240, innerRadius = 55, outerRadius = 90 }: PieDonutProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-xs text-white/30 uppercase tracking-widest">No data yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE.contentStyle}
          itemStyle={CHART_TOOLTIP_STYLE.itemStyle}
          formatter={(value: unknown, name: unknown) => [
            `${value} (${total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)`,
            String(name),
          ]}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: CHART_COLORS.text, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
