import { Trophy } from 'lucide-react';
import Link from 'next/link';

import { formatHashrate, formatNumber } from '../utils/helpers';

interface TopUserDifficultiesProps {
  users?: any[]; // Replace with proper type if available
  limit?: number;
}

const SMALL_LIMIT = 10;

// ... (existing imports, interface, constants)

export default function TopUserDifficulties({
  users = [],
  limit = SMALL_LIMIT,
}: TopUserDifficultiesProps) {
  try {
    return (
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span className="p-1 rounded-md bg-primary/10 text-primary">
              <Trophy size={20} />
            </span>
            {limit > SMALL_LIMIT
              ? `Top ${limit} User Difficulties Ever`
              : `Top ${limit} User Difficulties`}
          </h2>
          {limit <= SMALL_LIMIT && (
            <Link
              href="/top-difficulties"
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
                    <th>Best Diff</th>
                    <th>Session Diff</th>
                    <th>Hashrate 1hr</th>
                    <th>Hashrate 1d</th>
                    <th>Hashrate 7d</th>
                  </>
                ) : (
                  <th>Best Diff</th>
                )}
              </tr>
            </thead>
            <tbody className="text-foreground text-sm font-medium">
              {users.map((user, index) => (
                <tr key={user.address}>
                  <td>
                    {index + 1}{' '}
                    {user.workerCount === 0 ? (
                      <span
                        className="text-warning tooltip tooltip-right"
                        data-tip="No active workers"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 inline-block stroke-current"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </span>
                    ) : (
                      ''
                    )}
                  </td>
                  <td className="font-mono">
                    {user.address.slice(0, 6)}...{user.address.slice(-4)}
                  </td>

                  {limit > SMALL_LIMIT ? (
                    <>
                      <td
                        className={`${user.workerCount === 0 ? 'text-error' : ''}`}
                      >
                        {user.workerCount}
                      </td>
                      <td className="text-primary font-bold">
                        {formatNumber(Number(user.difficulty))}
                      </td>
                      <td>{formatNumber(Number(user.bestShare))}</td>
                      <td>{formatHashrate(user.hashrate1hr)}</td>
                      <td>{formatHashrate(user.hashrate1d)}</td>
                      <td>{formatHashrate(user.hashrate7d)}</td>
                    </>
                  ) : (
                    <td className="text-primary font-bold">
                      {formatNumber(Number(user.difficulty))}
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
    console.error('Error rendering top user difficulties:', error);
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Top {limit} User Difficulties
          </h2>
          <p className="text-error">
            Error loading top user difficulties. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
