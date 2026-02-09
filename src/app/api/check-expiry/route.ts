import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@line/bot-sdk';
import { getAllUsers } from '@/lib/redis';
import { getDaysRemaining } from '@/types';
import type { FoodItem } from '@/types';

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

const client = new Client(config);

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
        // Get all LINE users from Redis
        const allUsers = await getAllUsers();
        let notificationsSent = 0;
        let totalExpiringItems = 0;

        for (const userData of allUsers) {

            if (!userData || !userData.foodItems) continue;

            // Filter items expiring within 2 days
            const expiringItems = userData.foodItems.filter((item: FoodItem) => {
                const days = getDaysRemaining(item.expiryDate);
                return days >= 0 && days <= 2;
            });

            if (expiringItems.length === 0) continue;

            totalExpiringItems += expiringItems.length;

            // Build notification message
            const title = expiringItems.length === 1
                ? `🚨 ${expiringItems[0].name} expires soon!`
                : `🚨 ${expiringItems.length} items expiring soon!`;

            const itemsList = expiringItems
                .slice(0, 5)
                .map((item: FoodItem) => `• ${item.name} - ${getDaysText(getDaysRemaining(item.expiryDate))}`)
                .join('\n');

            const moreText = expiringItems.length > 5
                ? `\n...and ${expiringItems.length - 5} more`
                : '';

            const message = `${title}\n\n${itemsList}${moreText}\n\nOpen the app to check your items!`;

            try {
                await client.pushMessage(userData.userId, {
                    type: 'text',
                    text: message,
                });
                notificationsSent++;
                console.log(`[LINE] Notification sent to ${userData.userId}`);
            } catch (error) {
                console.error(`[LINE] Failed to send to ${userData.userId}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            users: allUsers.length,
            notificationsSent,
            totalExpiringItems,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in check-expiry:', error);
        return NextResponse.json(
            { error: 'Failed to check expiring items', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
    return GET(request);
}

function getDaysText(days: number): string {
    if (days === 0) return 'expires today!';
    if (days === 1) return 'expires tomorrow!';
    return `expires in ${days} days`;
}
