import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import webpush from 'web-push';
import { getDaysRemaining, type FoodItem } from '@/types';

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

        let sent = 0;
        let failed = 0;
        let skipped = 0;
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

                const userData = JSON.parse(subscriptionData);
                const items: FoodItem[] = userData.items || [];

                // Filter items expiring in the next 3 days
                const expiringItems = items.filter(item => {
                    const daysLeft = getDaysRemaining(item.expiryDate);
                    return daysLeft >= 0 && daysLeft <= 3;
                }).sort((a, b) => getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate));

                // Skip if no items expiring soon
                if (expiringItems.length === 0) {
                    console.log(`[Push] Skipping ${key}: no expiring items`);
                    skipped++;
                    continue;
                }

                // Send SEPARATE notification for EACH item
                const { items: _, createdAt, updatedAt, ...pushSubscription } = userData;

                for (const item of expiringItems) {
                    try {
                        const days = getDaysRemaining(item.expiryDate);
                        let emoji = '';
                        let body = '';

                        if (days === 0) {
                            emoji = '🚨';
                            body = `${emoji} Expires TODAY!`;
                        } else if (days === 1) {
                            emoji = '⚠️';
                            body = `${emoji} Expires TOMORROW`;
                        } else if (days === 2) {
                            emoji = '⚠️';
                            body = `${emoji} Expires in 2 days`;
                        } else {
                            emoji = '⚠️';
                            body = `${emoji} Expires in ${days} days`;
                        }

                        const payload = JSON.stringify({
                            title: item.name, // Food name as title
                            body: body,
                            icon: '/icons/icon-192.png',
                            badge: '/icons/icon-192.png',
                            tag: `expiry-${item.id}`, // Unique tag per item
                            url: '/'
                        });

                        await webpush.sendNotification(
                            pushSubscription as webpush.PushSubscription,
                            payload
                        );

                        console.log(`[Push] Sent notification for "${item.name}" (${days} days) to ${key}`);
                    } catch (itemErr: any) {
                        console.error(`[Push] Failed to send notification for item "${item.name}":`, itemErr.message);
                        // Don't fail the whole loop if one item fails
                    }
                }

                sent++;
                console.log(`[Push] Sent ${expiringItems.length} notifications to ${key}`);
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
            skipped,
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
