import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import type { FoodItem } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { endpoint, items } = body as { endpoint: string; items: FoodItem[] };

        if (!endpoint) {
            return NextResponse.json(
                { error: 'Missing endpoint' },
                { status: 400 }
            );
        }

        const key = `push:${Buffer.from(endpoint).toString('base64').slice(0, 50)}`;

        // Get existing subscription data
        const existingData = await redis.get(key);

        if (!existingData) {
            return NextResponse.json(
                { error: 'Subscription not found' },
                { status: 404 }
            );
        }

        const subscriptionData = JSON.parse(existingData);

        // Update with new items
        subscriptionData.items = items || [];
        subscriptionData.updatedAt = new Date().toISOString();

        await redis.set(key, JSON.stringify(subscriptionData));

        console.log(`[Sync] Updated items for ${key}: ${items?.length || 0} items`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Sync] Error:', error);
        return NextResponse.json(
            { error: 'Failed to sync items' },
            { status: 500 }
        );
    }
}
