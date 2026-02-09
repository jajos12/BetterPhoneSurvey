'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from '@/lib/chart-theme';

interface AreaTimeChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  lines: Array<{ key: string; color: string; name: string }>;
  height?: number;
}

export default function AreaTimeChart({ data, xKey, lines, height = 260 }: AreaTimeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          {lines.map(line => (
            <linearGradient key={line.key} id={`gradient-${line.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={line.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={line.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis
          dataKey={xKey}
          tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE.contentStyle}
          itemStyle={CHART_TOOLTIP_STYLE.itemStyle}
          labelStyle={CHART_TOOLTIP_STYLE.labelStyle}
        />
        {lines.map(line => (
          <Area
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            fill={`url(#gradient-${line.key})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
