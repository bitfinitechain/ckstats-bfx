import Dashboard from '../components/Dashboard';
import {
  getLatestPoolStats,
  getHistoricalPoolStats,
  getTopUserDifficulties,
  getTopUserHashrates,
} from '../lib/api';
import { serializeData } from '../utils/helpers';

export default async function Home() {
  try {
    const [
      latestStatsORM,
      historicalStatsORM,
      topDifficultiesORM,
      topHashratesORM,
    ] = await Promise.all([
      getLatestPoolStats(),
      getHistoricalPoolStats(),
      getTopUserDifficulties(),
      getTopUserHashrates(),
    ]);

    if (!latestStatsORM) {
      return (
        <main className="container mx-auto p-4">
          <p>No stats available at the moment. Please try again later.</p>
        </main>
      );
    }

    const initialData = {
      latestStats: serializeData(latestStatsORM),
      historicalStats: serializeData(historicalStatsORM),
      topDifficulties: serializeData(topDifficultiesORM),
      topHashrates: serializeData(topHashratesORM),
    };

    return <Dashboard initialData={initialData} />;
  } catch (error) {
    console.error('Error fetching pool stats:', error);
    return (
      <main className="container mx-auto p-4">
        <p>
          An error occurred while fetching the stats. Please try again later.
        </p>
      </main>
    );
  }
}
