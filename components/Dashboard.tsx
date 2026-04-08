'use client';

import useSWR from 'swr';

import PoolStatsChart from './PoolStatsChart';
import PoolStatsDisplay from './PoolStatsDisplay';
import SoloMiningInstruction from './SoloMiningInstruction';
import TopUserDifficulties from './TopUserDifficulties';
import TopUserHashrates from './TopUserHashrates';
import { PoolStats } from '../lib/entities/PoolStats';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface DashboardProps {
  initialData: {
    latestStats: PoolStats;
    historicalStats: PoolStats[];
    topDifficulties: any[];
    topHashrates: any[];
  };
}

export default function Dashboard({ initialData }: DashboardProps) {
  const { data, isValidating, mutate } = useSWR('/api/dashboard', fetcher, {
    fallbackData: initialData,
    refreshInterval: 60000,
    revalidateOnFocus: false,
  });

  const { latestStats, historicalStats, topDifficulties, topHashrates } =
    data || initialData;

  if (!latestStats) {
    return (
      <main className="container mx-auto p-4">
        <p>No stats available at the moment. Please try again later.</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4">
      <PoolStatsDisplay
        stats={latestStats}
        historicalStats={historicalStats || []}
        isValidating={isValidating}
        onRefresh={() => mutate()}
      />
      <SoloMiningInstruction />
      {historicalStats && historicalStats.length > 0 ? (
        <PoolStatsChart data={historicalStats} />
      ) : (
        <p>Historical data is not available.</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <TopUserDifficulties users={topDifficulties} />
        <TopUserHashrates users={topHashrates} />
      </div>
    </main>
  );
}
