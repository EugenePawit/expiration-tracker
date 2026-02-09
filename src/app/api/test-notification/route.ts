import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import webpush from 'web-push';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
    'mailto:contact@expiration-tracker.vercel.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { endpoint } = body;

        console.log('[Test Noti] Received request. Endpoint provided:', !!endpoint);

        const payload = JSON.stringify({
            title: '🔔 Test Notification',
            body: 'If you see this, your notifications are working perfectly! 🎉',
            url: '/',
            tag: 'test-notification'
        });

        const subscriptions = [];

        // If specific endpoint provided, find its full subscription object
        if (endpoint) {
            const key = `push:${Buffer.from(endpoint).toString('base64').slice(0, 50)}`;
            const subscriptionData = await redis.get(key);

            if (subscriptionData) {
                subscriptions.push(JSON.parse(subscriptionData));
            } else {
                console.warn('[Test Noti] Subscription not found in Redis for endpoint');
                // Fallback: try to construct subscription from endpoint alone (might fail if keys missing)
                // But usually we need the keys (p256dh, auth) which are in the Redis object
                return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
            }
        } else {
            // No endpoint? Send to all (broadcast test) - nice for debugging
            const keys = await redis.smembers('push:subscriptions');
            for (const key of keys) {
                const data = await redis.get(key);
                if (data) subscriptions.push(JSON.parse(data));
            }
        }

        if (subscriptions.length === 0) {
            return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 });
        }

        let sentCount = 0;
        const results = await Promise.allSettled(subscriptions.map(sub =>
            webpush.sendNotification(sub, payload)
        ));

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                sentCount++;
                console.log(`[Test Noti] Sent to subscription ${index + 1}`);
            } else {
                console.error(`[Test Noti] Failed to send to subscription ${index + 1}:`, result.reason);
            }
        });

        return NextResponse.json({
            success: true,
            sent: sentCount,
            total: subscriptions.length
        });

    } catch (error) {
        console.error('[Test Noti] Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}
