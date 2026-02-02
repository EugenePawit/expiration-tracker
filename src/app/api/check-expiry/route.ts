import { NextRequest, NextResponse } from 'next/server';
import { getAllSubscriptions, sendPushNotification } from '@/lib/webpush';
import { getDaysRemaining } from '@/types';

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
        const subscriptions = getAllSubscriptions();
        let notificationsSent = 0;
        let totalExpiringItems = 0;

        for (const { subscription, foodItems } of subscriptions) {
            // Filter items expiring within 2 days
            const expiringItems = foodItems.filter(item => {
                const days = getDaysRemaining(item.expiryDate);
                return days >= 0 && days <= 2;
            });

            if (expiringItems.length === 0) continue;

            totalExpiringItems += expiringItems.length;

            // Build notification message
            const title = expiringItems.length === 1
                ? `🚨 ${expiringItems[0].name} expires soon!`
                : `🚨 ${expiringItems.length} items expiring soon!`;

            const body = expiringItems.length === 1
                ? `${expiringItems[0].name} expires ${getDaysText(getDaysRemaining(expiringItems[0].expiryDate))}`
                : expiringItems
                    .slice(0, 3)
                    .map(item => `• ${item.name}`)
                    .join('\n') + (expiringItems.length > 3 ? `\n...and ${expiringItems.length - 3} more` : '');

            const success = await sendPushNotification(subscription, {
                title,
                body,
                url: '/',
            });

            if (success) notificationsSent++;
        }

        return NextResponse.json({
            success: true,
            subscriptions: subscriptions.length,
            notificationsSent,
            totalExpiringItems,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in check-expiry:', error);
        return NextResponse.json(
            { error: 'Failed to check expiring items' },
            { status: 500 }
        );
    }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
    return GET(request);
}

function getDaysText(days: number): string {
    if (days === 0) return 'today!';
    if (days === 1) return 'tomorrow!';
    return `in ${days} days`;
}
