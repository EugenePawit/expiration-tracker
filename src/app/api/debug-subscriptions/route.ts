import { NextResponse } from 'next/server';
import { getAllSubscriptions } from '@/lib/webpush';
import { getDaysRemaining } from '@/types';

// Debug endpoint to check subscription status
// Remove in production or add authentication
export async function GET() {
    const subscriptions = getAllSubscriptions();

    const debug = subscriptions.map(({ subscription, foodItems }) => ({
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        foodItemsCount: foodItems.length,
        foodItems: foodItems.map(item => ({
            name: item.name,
            expiryDate: item.expiryDate,
            daysRemaining: getDaysRemaining(item.expiryDate),
        })),
        updatedAt: new Date().toISOString(),
    }));

    return NextResponse.json({
        totalSubscriptions: subscriptions.length,
        subscriptions: debug,
        timestamp: new Date().toISOString(),
    });
}
