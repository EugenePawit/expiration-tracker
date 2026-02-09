import { NextRequest, NextResponse } from 'next/server';
import { setUser } from '@/lib/redis';
import type { FoodItem } from '@/types';

// API endpoint to sync food items from client to server
export async function POST(request: NextRequest) {
    try {
        const { userId, foodItems } = await request.json();

        if (!userId || !Array.isArray(foodItems)) {
            return NextResponse.json(
                { error: 'Invalid request: userId and foodItems required' },
                { status: 400 }
            );
        }

        // Update user's food items in Redis storage
        await setUser(userId, {
            userId,
            foodItems: foodItems as FoodItem[],
            updatedAt: new Date().toISOString(),
        });

        console.log(`[LINE] Food items synced for user ${userId}: ${foodItems.length} items`);

        return NextResponse.json({
            success: true,
            itemCount: foodItems.length,
        });
    } catch (error) {
        console.error('Error syncing food items:', error);
        return NextResponse.json(
            { error: 'Failed to sync food items' },
            { status: 500 }
        );
    }
}
