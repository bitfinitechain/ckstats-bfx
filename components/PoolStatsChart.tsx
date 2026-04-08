'use client';

import { useState } from 'react';

import { Users, Activity, Zap } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LegendType,
  Brush,
  CartesianGrid,
} from 'recharts';

import { PoolStats } from '../lib/entities/PoolStats';
import { ISOUnit, findISOUnit } from '../utils/helpers';

interface PoolStatsChartProps {
  data: PoolStats[];
}

export default function PoolStatsChart({ data }: PoolStatsChartProps) {
  const [visibleLines, setVisibleLines] = useState({
    '1m': false,
    '5m': true,
    '15m': true,
    '1hr': true,
    '6hr': true,
    '1d': true,
    '7d': true,
  });

  const handleLegendClick = (dataKey: string) => {
    setVisibleLines((prev) => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };

  const legendPayload = [
    {
      value: '1m',
      type: 'rect',
      color: visibleLines['1m'] ? '#8884d8' : '#aaaaaa',
    },
    {
      value: '5m',
      type: 'rect',
      color: visibleLines['5m'] ? '#82ca9d' : '#aaaaaa',
    },
    {
      value: '15m',
      type: 'rect',
      color: visibleLines['15m'] ? '#ffc658' : '#aaaaaa',
    },
    {
      value: '1hr',
      type: 'rect',
      color: visibleLines['1hr'] ? '#ff7300' : '#aaaaaa',
    },
    {
      value: '6hr',
      type: 'rect',
      color: visibleLines['6hr'] ? '#00C49F' : '#aaaaaa',
    },
    {
      value: '1d',
      type: 'rect',
      color: visibleLines['1d'] ? '#0088FE' : '#aaaaaa',
    },
    {
      value: '7d',
      type: 'rect',
      color: visibleLines['7d'] ? '#FF1493' : '#aaaaaa',
    },
  ];

  // Calculate the maximum hashrate
  const maxHashrate = Math.max(
    ...data.flatMap((stat) => [
      Number(stat.hashrate1m),
      Number(stat.hashrate5m),
      Number(stat.hashrate15m),
      Number(stat.hashrate1hr),
      Number(stat.hashrate6hr),
      Number(stat.hashrate1d),
      Number(stat.hashrate7d),
    ])
  );

  // Find out the nearest ISO unit
  const hashrateUnit: ISOUnit = findISOUnit(Number(maxHashrate));
  const hashrateDivisor: number = hashrateUnit.threshold;

  // Reverse the data array
  const reversedData = [...data].reverse();

  // Format the reversed data for the charts
  const formattedData = reversedData.map((item) => ({
    ...item,
    timestamp: new Date(item.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    hashrate1m: Number(item.hashrate1m) / hashrateDivisor,
    hashrate5m: Number(item.hashrate5m) / hashrateDivisor,
    hashrate15m: Number(item.hashrate15m) / hashrateDivisor,
    hashrate1hr: Number(item.hashrate1hr) / hashrateDivisor,
    hashrate6hr: Number(item.hashrate6hr) / hashrateDivisor,
    hashrate1d: Number(item.hashrate1d) / hashrateDivisor,
    hashrate7d: Number(item.hashrate7d) / hashrateDivisor,
    SPS1m: item.SPS1m ?? 0,
    SPS5m: item.SPS5m ?? 0,
    SPS15m: item.SPS15m ?? 0,
    SPS1h: item.SPS1h ?? 0,
  }));

  const hashrateTooltipFormatter = (value: number, name: string) => [
    `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${hashrateUnit.iso}H/s`,
    name,
  ];

  const spsTooltipFormatter = (value: number, name: string) => [
    `${value > 10 ? value.toFixed(0) : value.toFixed(1)} SPS`,
    name,
  ];

  const renderGradientDefs = () => (
    <defs>
      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#0644f1" stopOpacity={0.2} />
        <stop offset="95%" stopColor="#0644f1" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="colorWorkers" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#3abff8" stopOpacity={0.2} />
        <stop offset="95%" stopColor="#3abff8" stopOpacity={0} />
      </linearGradient>
      {/* Add more gradients if needed for hashrates/SPS, mostly reusing colors or specific ones */}
    </defs>
  );

  const renderUsersChart = () => (
    <div className="mb-8 w-full rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span className="p-1 rounded-md bg-primary/10 text-primary">
            <Users size={20} />
          </span>
          Users and Workers
        </h2>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            {renderGradientDefs()}
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
              opacity={0.4}
            />
            <XAxis
              dataKey="timestamp"
              minTickGap={40}
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              yAxisId="left"
              allowDataOverflow={true}
              domain={['auto', 'auto']}
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              allowDataOverflow={true}
              domain={['auto', 'auto']}
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '12px',
                boxShadow:
                  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              }}
              itemStyle={{ color: 'var(--card-foreground)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Brush
              dataKey="timestamp"
              height={30}
              alwaysShowText={false}
              startIndex={
                formattedData.length - 1440 > 0
                  ? formattedData.length - 1440
                  : 0
              }
              stroke="var(--primary)"
              fill="var(--background)"
              tickFormatter={() => ''}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="users"
              stroke="#0644f1"
              fillOpacity={1}
              fill="url(#colorUsers)"
              name="Users"
              strokeWidth={2}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="workers"
              stroke="#3abff8"
              fillOpacity={1}
              fill="url(#colorWorkers)"
              name="Workers"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderHashrateChart = () => (
    <div className="mb-8 w-full rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span className="p-1 rounded-md bg-primary/10 text-primary">
            <Activity size={20} />
          </span>
          Hashrate ({hashrateUnit.iso}H/s)
        </h2>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
              opacity={0.4}
            />
            <XAxis
              dataKey="timestamp"
              minTickGap={40}
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              allowDataOverflow={true}
              domain={['auto', 'auto']}
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <Tooltip
              formatter={hashrateTooltipFormatter}
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '12px',
                boxShadow:
                  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              }}
              itemStyle={{ color: 'var(--card-foreground)' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              payload={legendPayload.map((item) => ({
                ...item,
                type: item.type as LegendType,
              }))}
              onClick={(e) => handleLegendClick(e.value)}
            />
            <Brush
              dataKey="timestamp"
              height={30}
              alwaysShowText={false}
              startIndex={
                formattedData.length - 1440 > 0
                  ? formattedData.length - 1440
                  : 0
              }
              stroke="var(--primary)"
              fill="var(--background)"
              tickFormatter={() => ''}
            />
            {visibleLines['1m'] && (
              <Area
                type="monotone"
                dataKey="hashrate1m"
                name="1M"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            )}
            {visibleLines['5m'] && (
              <Area
                type="monotone"
                dataKey="hashrate5m"
                name="5M"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            )}
            {visibleLines['15m'] && (
              <Area
                type="monotone"
                dataKey="hashrate15m"
                name="15M"
                stroke="#ffc658"
                fill="#ffc658"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            )}
            {visibleLines['1hr'] && (
              <Area
                type="monotone"
                dataKey="hashrate1hr"
                name="1HR"
                stroke="#ff7300"
                fill="#ff7300"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            )}
            {visibleLines['6hr'] && (
              <Area
                type="monotone"
                dataKey="hashrate6hr"
                name="6HR"
                stroke="#00C49F"
                fill="#00C49F"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            )}
            {visibleLines['1d'] && (
              <Area
                type="monotone"
                dataKey="hashrate1d"
                name="1D"
                stroke="#0088FE"
                fill="#0088FE"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            )}
            {visibleLines['7d'] && (
              <Area
                type="monotone"
                dataKey="hashrate7d"
                name="7D"
                stroke="#FF1493"
                fill="#FF1493"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderSPSChart = () => (
    <div className="mb-8 w-full rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span className="p-1 rounded-md bg-primary/10 text-primary">
            <Zap size={20} />
          </span>
          Shares Per Second
        </h2>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
              opacity={0.4}
            />
            <XAxis
              dataKey="timestamp"
              minTickGap={40}
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              allowDataOverflow={true}
              domain={['auto', 'auto']}
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <Tooltip
              formatter={spsTooltipFormatter}
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '12px',
                boxShadow:
                  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              }}
              itemStyle={{ color: 'var(--card-foreground)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Brush
              dataKey="timestamp"
              height={30}
              alwaysShowText={false}
              startIndex={
                formattedData.length - 1440 > 0
                  ? formattedData.length - 1440
                  : 0
              }
              stroke="var(--primary)"
              fill="var(--background)"
              tickFormatter={() => ''}
            />
            <Area
              type="monotone"
              dataKey="SPS1m"
              name="1M"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="SPS5m"
              name="5M"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="SPS15m"
              name="15M"
              stroke="#ffc658"
              fill="#ffc658"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="SPS1h"
              name="1H"
              stroke="#ff7300"
              fill="#ff7300"
              fillOpacity={0.1}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="mt-8 grid gap-6">
      {renderUsersChart()}
      {renderHashrateChart()}
      {renderSPSChart()}
    </div>
  );
}
