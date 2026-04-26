import redis from './redis.js';

export async function getCache<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
}

export async function setCache(
    key: string,
    value: unknown,
    ttlSeconds = 60
): Promise<void> {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function deleteCache(key: string): Promise<void> {
    await redis.del(key);
}