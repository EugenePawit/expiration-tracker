import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import type { FoodItem } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { subscription, items } = body as { subscription: any; items?: FoodItem[] };

        // Support both old format (just subscription) and new format (with items)
        const subscriptionData = subscription || body;

        if (!subscriptionData.endpoint) {
            return NextResponse.json(
                { error: 'Invalid subscription: missing endpoint' },
                { status: 400 }
            );
        }

        // Use endpoint as unique key
        const key = `push:${Buffer.from(subscriptionData.endpoint).toString('base64').slice(0, 50)}`;

        // Store subscription with timestamp and items
        await redis.set(key, JSON.stringify({
            ...subscriptionData,
            items: items || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));

        // Also add to set for easy iteration
        await redis.sadd('push:subscriptions', key);

        console.log('[Subscribe] Saved subscription:', key, `with ${items?.length || 0} items`);

        return NextResponse.json({ success: true, key });
    } catch (error) {
        console.error('[Subscribe] Error:', error);
        return NextResponse.json(
            { error: 'Failed to save subscription' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { endpoint } = await request.json();

        if (!endpoint) {
            return NextResponse.json(
                { error: 'Missing endpoint' },
                { status: 400 }
            );
        }

        const key = `push:${Buffer.from(endpoint).toString('base64').slice(0, 50)}`;

        await redis.del(key);
        await redis.srem('push:subscriptions', key);

        console.log('[Subscribe] Removed subscription:', key);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Subscribe] Delete error:', error);
        return NextResponse.json(
            { error: 'Failed to remove subscription' },
            { status: 500 }
        );
    }
}
