import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(request: NextRequest) {
    try {
        const subscription = await request.json();

        if (!subscription.endpoint) {
            return NextResponse.json(
                { error: 'Invalid subscription: missing endpoint' },
                { status: 400 }
            );
        }

        // Use endpoint as unique key
        const key = `push:${Buffer.from(subscription.endpoint).toString('base64').slice(0, 50)}`;

        // Store subscription with timestamp
        // ioredis uses JSON.stringify implicitly for objects? No, usually stores strings.
        // We should stringify it manually just to be safe and consistent.
        await redis.set(key, JSON.stringify({
            ...subscription,
            createdAt: new Date().toISOString()
        }));

        // Also add to set for easy iteration
        await redis.sadd('push:subscriptions', key);

        console.log('[Subscribe] Saved subscription:', key);

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
