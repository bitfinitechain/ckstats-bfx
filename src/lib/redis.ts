import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = createClient({
    url: redisUrl,
});

redis.on('error', (err) => console.log('Redis Client Error', err));

export async function initRedis() {
    if (!redis.isOpen) {
        await redis.connect();
    }
}
