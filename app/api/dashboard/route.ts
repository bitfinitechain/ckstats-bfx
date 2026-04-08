import { NextResponse } from 'next/server';

import {
  getLatestPoolStats,
  getHistoricalPoolStats,
  getTopUserDifficulties,
  getTopUserHashrates,
} from '../../../lib/api';
import { serializeData } from '../../../utils/helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [latestStatsORM, historicalStatsORM, topDifficulties, topHashrates] =
      await Promise.all([
        getLatestPoolStats(),
        getHistoricalPoolStats(),
        getTopUserDifficulties(),
        getTopUserHashrates(),
      ]);

    const latestStats = latestStatsORM ? serializeData(latestStatsORM) : null;
    const historicalStats = serializeData(historicalStatsORM);

    return NextResponse.json({
      latestStats,
      historicalStats,
      topDifficulties,
      topHashrates,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
