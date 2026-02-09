import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import webpush from 'web-push';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
    'mailto:contact@expiration-tracker.vercel.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
);

// This endpoint is called by external cron service (cron-job.org)
export async function GET(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        // Get all subscription keys
        const subscriptionKeys = await redis.smembers('push:subscriptions');

        if (!subscriptionKeys || subscriptionKeys.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No subscriptions found',
                sent: 0
            });
        }

        console.log(`[Push] Found ${subscriptionKeys.length} subscriptions`);

        const payload = JSON.stringify({
            title: '🚨 Food Expiry Reminder',
            body: 'Check your food expiry tracker - you may have items expiring soon!',
            url: '/'
        });

        let sent = 0;
        let failed = 0;
        const failedKeys: string[] = [];

        // Send to all subscriptions
        for (const key of subscriptionKeys) {
            try {
                // ioredis returns string, need to parse
                const subscriptionData = await redis.get(key);

                if (!subscriptionData) {
                    failedKeys.push(key);
                    continue;
                }

                const subscription = JSON.parse(subscriptionData);

                await webpush.sendNotification(
                    subscription as webpush.PushSubscription,
                    payload
                );
                sent++;
                console.log(`[Push] Sent to ${key}`);
            } catch (err: any) {
                console.error(`[Push] Failed to send to ${key}:`, err.message);
                failed++;

                // If subscription is expired/invalid, remove it
                if (err.statusCode === 410 || err.statusCode === 404) {
                    failedKeys.push(key);
                }
            }
        }

        // Clean up invalid subscriptions
        for (const key of failedKeys) {
            await redis.del(key);
            await redis.srem('push:subscriptions', key);
            console.log(`[Push] Removed invalid subscription: ${key}`);
        }

        return NextResponse.json({
            success: true,
            sent,
            failed,
            cleaned: failedKeys.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in check-expiry:', error);
        return NextResponse.json(
            { error: 'Failed to send notifications', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
    return GET(request);
}
