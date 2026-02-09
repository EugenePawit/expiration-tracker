import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedisClient(): Redis {
    if (!redis) {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            throw new Error('REDIS_URL environment variable is not set');
        }
        redis = new Redis(redisUrl);
    }
    return redis;
}

export async function setUser(userId: string, data: any) {
    const client = getRedisClient();
    await client.set(`line:user:${userId}`, JSON.stringify(data));
}

export async function getUser(userId: string) {
    const client = getRedisClient();
    const data = await client.get(`line:user:${userId}`);
    return data ? JSON.parse(data) : null;
}

export async function getAllUsers() {
    const client = getRedisClient();
    const keys = await client.keys('line:user:*');
    const users = [];

    for (const key of keys) {
        const data = await client.get(key);
        if (data) {
            users.push(JSON.parse(data));
        }
    }

    return users;
}
