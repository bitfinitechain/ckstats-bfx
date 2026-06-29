import { Zap } from 'lucide-react';
import Link from 'next/link';

import { formatHashrate, formatNumber } from '../utils/helpers';

interface TopUserHashratesProps {
  users?: any[]; // Replace with proper type if available
  limit?: number;
}

const SMALL_LIMIT = 10;

const thBase =
  'text-[11px] font-medium uppercase tracking-wider text-muted-foreground py-2';
const thNum = `${thBase} text-right`;

export default function TopUserHashrates({
  users = [],
  limit = SMALL_LIMIT,
}: TopUserHashratesProps) {
  try {
    return (
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Zap size={18} />
            </span>
            {limit > SMALL_LIMIT
              ? `Top ${limit} Active User Hashrates`
              : `Top ${limit} User Hashrates`}
          </h2>
          {limit <= SMALL_LIMIT && (
            <Link
              href="/top-hashrates"
              className="text-xs font-medium uppercase tracking-wide text-primary hover:underline"
              title="View All"
            >
              View All
            </Link>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className={`${thBase} text-left w-12`}>Rank</th>
                <th className={`${thBase} text-left`}>Address</th>
                {limit > SMALL_LIMIT ? (
                  <>
                    <th className={thNum}>Workers</th>
                    <th className={thNum}>1hr</th>
                    <th className={thNum}>1d</th>
                    <th className={thNum}>7d</th>
                    <th className={thNum}>Session Diff</th>
                    <th className={thNum}>Best Diff</th>
                  </>
                ) : (
                  <th className={thNum}>Hashrate</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user, index) => (
                <tr
                  key={user.address}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <td className="py-2.5 tabular-nums text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="py-2.5 font-mono text-foreground">
                    {user.address.slice(0, 6)}...{user.address.slice(-4)}
                  </td>

                  {limit > SMALL_LIMIT ? (
                    <>
                      <td className="py-2.5 text-right tabular-nums text-foreground">
                        {user.workerCount}
                      </td>
                      <td className="py-2.5 text-right tabular-nums font-semibold text-primary">
                        {formatHashrate(user.hashrate1hr)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                        {formatHashrate(user.hashrate1d)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                        {formatHashrate(user.hashrate7d)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-foreground">
                        {formatNumber(Number(user.bestShare))}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-foreground">
                        {formatNumber(Number(user.bestEver))}
                      </td>
                    </>
                  ) : (
                    <td className="py-2.5 text-right tabular-nums font-semibold text-primary">
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
      <div className="bg-card border border-border rounded-xl shadow-sm">
        <div className="p-6">
          <h2 className="text-base font-semibold tracking-tight text-foreground mb-4">
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
