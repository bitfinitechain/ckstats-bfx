import {
  RotateCw,
  Users,
  Share2,
  Activity,
  Clock,
  Zap,
  ExternalLink,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import { PoolStats } from '../lib/entities/PoolStats';
import {
  formatNumber,
  formatHashrate,
  formatTimeAgo,
  formatDuration,
  calculatePercentageChange,
  getPercentageChangeColor,
  calculateAverageTimeToBlock,
} from '../utils/helpers';

const CountdownTimer = dynamic(() => import('./CountdownTimer'), {
  ssr: false,
});

interface PoolStatsDisplayProps {
  stats: PoolStats;
  historicalStats: PoolStats[];
  isValidating?: boolean;
  onRefresh?: () => void;
}

export default function PoolStatsDisplay({
  stats,
  historicalStats,
  isValidating = false,
  onRefresh,
}: PoolStatsDisplayProps) {
  // Helper function to format values
  const formatValue = (key: string, value: any): string => {
    if (key.startsWith('hashrate')) {
      return formatHashrate(value);
    } else if (key === 'diff') {
      return `${formatNumber(value)}%`;
      // const networkDiff = (stats.accepted * BigInt(10000)) / BigInt(Math.round(Number(stats.diff) * 100));
      // return `${(Number(networkDiff) / 1e12).toFixed(2)}T`;
    } else if (
      typeof value === 'bigint' ||
      typeof value === 'number' ||
      typeof value === 'string'
    ) {
      return formatNumber(value);
    } else if (key === 'timestamp') {
      return new Date(value).toISOString().slice(0, 19) + ' UTC';
    }
    return String(value);
  };

  // Helper function to format keys
  const formatKey = (key: string): string => {
    // Handle hashrate and SPS cases
    if (key.startsWith('hashrate') || key.startsWith('SPS')) {
      return key.replace(/^(hashrate|SPS)/, '').toUpperCase();
    } else if (key === 'diff') {
      return '% of Network Diff';
    } else if (key === 'bestshare') {
      return 'Best Diff';
    }
    // General case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  const statGroups = [
    { title: 'Users', keys: ['users', 'disconnected', 'workers'], icon: Users },
    {
      title: 'Shares',
      keys: ['accepted', 'rejected', 'bestshare', 'diff'],
      icon: Share2,
    },
    {
      title: 'Shares Per Second',
      keys: ['SPS1m', 'SPS5m', 'SPS15m', 'SPS1h'],
      icon: Zap,
    },
  ];

  const hashrateGroup = {
    title: 'Hashrates',
    keys: [
      'hashrate1m',
      'hashrate5m',
      'hashrate15m',
      'hashrate1hr',
      'hashrate6hr',
      'hashrate1d',
      'hashrate7d',
    ],
    icon: Activity,
  };

  // Shared microlabel: lighter weight + wider tracking reads calmer than the
  // bold uppercase "generic dashboard" look (restraint over decoration).
  const labelClass =
    'text-[11px] font-medium uppercase tracking-wider text-muted-foreground leading-tight';
  const valueClass =
    'text-2xl font-semibold tabular-nums tracking-tight text-foreground';

  const renderPercentageChange = (key: string) => {
    if (historicalStats.length < 120)
      return <div className="mt-1 text-xs text-muted-foreground">—</div>;

    const currentValue = Number(stats[key]);
    const pastValue = Number(
      historicalStats[historicalStats.length - 120][key]
    );

    const change = calculatePercentageChange(currentValue, pastValue);
    const color = getPercentageChangeColor(change);

    return (
      <div
        className={`tooltip mt-1 text-left text-xs font-medium tabular-nums ${color}`}
        data-tip="24 hour % change"
      >
        {change === 'N/A' ? '—' : `${change > 0 ? '+' : ''}${change}%`}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* General Info Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Activity size={18} />
            </span>
            General Info
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isValidating}
                className="ml-1 p-1 hover:bg-muted rounded-full transition-colors"
                aria-label="Refresh Data"
              >
                <RotateCw
                  size={15}
                  className={`text-muted-foreground ${isValidating ? 'animate-spin text-primary' : ''}`}
                />
              </button>
            )}
          </h2>
          <CountdownTimer
            key={stats.timestamp.toString()}
            initialSeconds={60}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-1">
            <span className={`${labelClass} flex items-center gap-1.5`}>
              <Clock size={12} />
              Uptime
            </span>
            <div className={valueClass}>
              {formatDuration(stats.runtime)}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className={`${labelClass} flex items-center gap-1.5`}>
              <RotateCw size={12} />
              Last Update
            </span>
            <div className={valueClass}>
              {formatTimeAgo(stats.timestamp)}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className={`${labelClass} flex items-center gap-1.5`}>
              <Zap size={12} />
              Avg Time to Find a Block
            </span>
            <div className={valueClass}>
              {stats.hashrate6hr && stats.diff
                ? formatDuration(
                    calculateAverageTimeToBlock(
                      stats.hashrate6hr,
                      (BigInt(stats.accepted) * BigInt(10000)) /
                        BigInt(Math.round(Number(stats.diff) * 100))
                    )
                  )
                : 'N/A'}
            </div>
            <Link
              href="https://explorer.bitfinitechain.org/blocks"
              target="_blank"
              className="text-xs font-medium text-primary hover:underline mt-1.5 flex items-center gap-1"
            >
              Found Blocks
              <ExternalLink size={10} />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statGroups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <div
              key={group.title}
              className="bg-card border border-border rounded-xl shadow-sm p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <GroupIcon size={18} />
                  </span>
                  {group.title}
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6">
                {group.keys.map((key) => (
                  <div key={key} className="flex flex-col gap-1 min-w-0">
                    <span className={labelClass}>{formatKey(key)}</span>
                    <div className={valueClass}>
                      {formatValue(key, stats[key])}
                    </div>
                    {key === 'users' && (
                      <div className="text-xs text-muted-foreground">
                        Idle: {formatNumber(stats.idle)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hashrates Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Activity size={18} />
            </span>
            {hashrateGroup.title}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-x-4 gap-y-6 divide-x-0 md:divide-x divide-border">
          {hashrateGroup.keys.map((key, index) => (
            <div
              key={key}
              className={`flex flex-col gap-1 ${index !== 0 ? 'pl-0 md:pl-6' : ''}`}
            >
              <span className={labelClass}>{formatKey(key)}</span>
              <div className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                {formatValue(key, stats[key])}
              </div>
              {renderPercentageChange(key)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
