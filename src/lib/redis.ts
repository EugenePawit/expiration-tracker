import Redis from 'ioredis';

const getRedisClient = () => {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        throw new Error('REDIS_URL is not defined');
    }

    // Use a singleton pattern for development to prevent connection leaks
    // In production (serverless), it might create a new connection per lambda invocation
    // which is generally handled by Vercel/Redis cloud providers.
    const client = new Redis(redisUrl);
    return client;
};

// Export a singleton instance if needed, or just the client getter
export const redis = getRedisClient();
