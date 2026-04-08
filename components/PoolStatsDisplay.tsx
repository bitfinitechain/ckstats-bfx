import {
  RotateCw,
  Users,
  Share2,
  Activity,
  Clock,
  Zap,
  ExternalLink,
  UserX,
  CheckCircle2,
  XCircle,
  Trophy,
  PieChart,
  HardDrive,
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

  const getIconForKey = (key: string) => {
    if (key.startsWith('hashrate')) return <Activity size={12} />;
    if (key.startsWith('SPS')) return <Zap size={12} />;

    switch (key) {
      case 'users':
        return <Users size={12} />;
      case 'disconnected':
        return <UserX size={12} />;
      case 'workers':
        return <HardDrive size={12} />;
      case 'accepted':
        return <CheckCircle2 size={12} />;
      case 'rejected':
        return <XCircle size={12} />;
      case 'bestshare':
        return <Trophy size={12} />;
      case 'diff':
        return <PieChart size={12} />;
      default:
        return null;
    }
  };

  const renderPercentageChange = (key: string) => {
    if (historicalStats.length < 120) return 'N/A';

    const currentValue = Number(stats[key]);
    const pastValue = Number(
      historicalStats[historicalStats.length - 120][key]
    );

    const change = calculatePercentageChange(currentValue, pastValue);
    const color = getPercentageChangeColor(change);

    return (
      <div
        className={`stat-desc tooltip text-left ${color}`}
        data-tip="24 hour % change"
      >
        {change === 'N/A' ? 'N/A' : `${change}%`}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* General Info Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            General Info
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isValidating}
                className="ml-2 p-1 hover:bg-muted rounded-full transition-colors"
                aria-label="Refresh Data"
              >
                <RotateCw
                  size={16}
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
          <div className="flex flex-col">
            <span className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
              <Clock size={12} />
              Uptime
            </span>
            <div className="text-2xl font-bold text-foreground">
              {formatDuration(stats.runtime)}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
              <RotateCw size={12} />
              Last Update
            </span>
            <div className="text-2xl font-bold text-foreground">
              {formatTimeAgo(stats.timestamp)}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
              <Zap size={12} />
              Avg Time to Find a Block
            </span>
            <div className="text-2xl font-bold text-foreground">
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
              className="text-xs text-primary hover:underline mt-1 flex items-center gap-1"
            >
              Found Blocks
              <ExternalLink size={10} />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statGroups.map((group) => (
          <div
            key={group.title}
            className="bg-card border border-border rounded-xl shadow-sm p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                {group.title}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {group.keys.map((key) => (
                <div key={key} className="flex flex-col">
                  <span className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                    {getIconForKey(key)}
                    {formatKey(key)}
                  </span>
                  <div className="text-2xl font-bold text-foreground">
                    {formatValue(key, stats[key])}
                  </div>
                  {key === 'users' && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Idle: {formatNumber(stats.idle)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hashrates Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            {hashrateGroup.title}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 divide-x-0 md:divide-x divide-border">
          {hashrateGroup.keys.map((key, index) => (
            <div
              key={key}
              className={`flex flex-col ${index !== 0 ? 'pl-0 md:pl-6' : ''}`}
            >
              <span className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                {getIconForKey(key)}
                {formatKey(key)}
              </span>
              <div className="text-xl font-bold text-foreground">
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
