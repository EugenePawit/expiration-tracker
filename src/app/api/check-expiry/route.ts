import { NextRequest, NextResponse } from 'next/server';
import { getDaysRemaining } from '@/types';
import type { FoodItem } from '@/types';

// OneSignal REST API endpoint
const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';

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
        const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
        const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

        if (!appId || !restApiKey) {
            throw new Error('OneSignal credentials not configured');
        }

        // Get all users with tags using OneSignal API
        // Note: We'll use a simpler approach - send to all subscribed users
        // and check their tags to filter expiring items

        // Since we store foodItems as tags, we need to fetch users and check their tags
        // For MVP, we'll send a notification to all users and they can check locally
        // A more advanced approach would use OneSignal Segments

        const response = await fetch(ONESIGNAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${restApiKey}`,
            },
            body: JSON.stringify({
                app_id: appId,
                included_segments: ['Subscribed Users'],
                contents: {
                    en: 'Check your food expiry tracker - you may have items expiring soon!',
                },
                headings: {
                    en: '🚨 Food Expiry Reminder',
                },
                url: '/',
                // We can use filters to target specific users with expiring items
                // For now, sending to all users
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('OneSignal API error:', result);
            throw new Error(`OneSignal API error: ${result.errors || 'Unknown error'}`);
        }

        console.log('[OneSignal] Notification sent successfully:', result);

        return NextResponse.json({
            success: true,
            recipients: result.recipients || 0,
            oneSignalId: result.id,
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

function getDaysText(days: number): string {
    if (days === 0) return 'today!';
    if (days === 1) return 'tomorrow!';
    return `in ${days} days`;
}
