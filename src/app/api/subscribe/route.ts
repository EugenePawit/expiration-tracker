import { NextRequest, NextResponse } from 'next/server';
import { saveSubscription } from '@/lib/webpush';
import type { SerializedPushSubscription, FoodItem } from '@/types';

interface SubscribeRequestBody {
    subscription: SerializedPushSubscription;
    foodItems: FoodItem[];
}

export async function POST(request: NextRequest) {
    try {
        const body: SubscribeRequestBody = await request.json();

        if (!body.subscription || !body.subscription.endpoint || !body.subscription.keys) {
            return NextResponse.json(
                { error: 'Invalid subscription data' },
                { status: 400 }
            );
        }

        // Save subscription with food items
        saveSubscription(body.subscription, body.foodItems || []);

        return NextResponse.json({
            success: true,
            message: 'Subscription saved'
        });
    } catch (error) {
        console.error('Error saving subscription:', error);
        return NextResponse.json(
            { error: 'Failed to save subscription' },
            { status: 500 }
        );
    }
}
