import { Zap } from 'lucide-react';
import Link from 'next/link';

import { formatHashrate, formatNumber } from '../utils/helpers';

interface TopUserHashratesProps {
  users?: any[]; // Replace with proper type if available
  limit?: number;
}

const SMALL_LIMIT = 10;

// ... (existing imports)

export default function TopUserHashrates({
  users = [],
  limit = SMALL_LIMIT,
}: TopUserHashratesProps) {
  try {
    return (
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span className="p-1 rounded-md bg-primary/10 text-primary">
              <Zap size={20} />
            </span>
            {limit > SMALL_LIMIT
              ? `Top ${limit} Active User Hashrates`
              : `Top ${limit} User Hashrates`}
          </h2>
          {limit <= SMALL_LIMIT && (
            <Link
              href="/top-hashrates"
              className="text-xs text-primary hover:underline uppercase font-bold"
              title="View All"
            >
              View All
            </Link>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full table-sm sm:table-md">
            <thead className="text-muted-foreground text-xs uppercase font-bold">
              <tr>
                <th>Rank</th>
                <th>Address</th>
                {limit > SMALL_LIMIT ? (
                  <>
                    <th>Active Workers</th>
                    <th>Hashrate 1hr</th>
                    <th>Hashrate 1d</th>
                    <th>Hashrate 7d</th>
                    <th>Session Diff</th>
                    <th>Best Diff</th>
                  </>
                ) : (
                  <th>Hashrate</th>
                )}
              </tr>
            </thead>
            <tbody className="text-foreground text-sm font-medium">
              {users.map((user, index) => (
                <tr key={user.address}>
                  <td>{index + 1}</td>
                  <td className="font-mono">
                    {user.address.slice(0, 6)}...{user.address.slice(-4)}
                  </td>

                  {limit > SMALL_LIMIT ? (
                    <>
                      <td>{user.workerCount}</td>
                      <td className="text-primary font-bold">
                        {formatHashrate(user.hashrate1hr)}
                      </td>
                      <td>{formatHashrate(user.hashrate1d)}</td>
                      <td>{formatHashrate(user.hashrate7d)}</td>
                      <td>{formatNumber(Number(user.bestShare))}</td>
                      <td>{formatNumber(Number(user.bestEver))}</td>
                    </>
                  ) : (
                    <td className="text-primary font-bold">
                      {formatHashrate(user.hashrate1hr)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering top user hashrates:', error);
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Top {limit} User Hashrates
          </h2>
          <p className="text-error">
            Error loading top user hashrates. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
