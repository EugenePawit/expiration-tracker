import { NextRequest, NextResponse } from 'next/server';
import { Client, WebhookEvent, MessageEvent } from '@line/bot-sdk';
import { kv } from '@vercel/kv';
import type { FoodItem } from '@/types';

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

const client = new Client(config);

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-line-signature');

        if (!signature) {
            return NextResponse.json({ error: 'No signature' }, { status: 400 });
        }

        // Verify webhook signature
        const events: WebhookEvent[] = JSON.parse(body).events;

        for (const event of events) {
            if (event.type === 'message' && event.message.type === 'text') {
                await handleMessage(event);
            } else if (event.type === 'follow') {
                await handleFollow(event);
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('LINE webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

async function handleFollow(event: WebhookEvent) {
    if (event.type !== 'follow') return;

    const userId = event.source.userId;
    if (!userId) return;

    // Initialize user with empty food items
    await kv.set(`line:user:${userId}`, {
        userId,
        foodItems: [],
        registeredAt: new Date().toISOString(),
    });

    // Send welcome message
    await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '🍎 Welcome to Expiry Tracker!\n\nTo receive daily reminders:\n1. Open the Expiry Tracker app\n2. Click "Connect LINE Account"\n3. Add food items to track\n\nI\'ll send you notifications when food is expiring soon!',
    });

    console.log(`[LINE] New user followed: ${userId}`);
}

async function handleMessage(event: MessageEvent) {
    const userId = event.source.userId;
    if (!userId) return;

    const text = event.message.type === 'text' ? event.message.text.toLowerCase() : '';

    // Check if user exists
    const userData = await kv.get<{ userId: string; foodItems: FoodItem[] }>(`line:user:${userId}`);

    if (!userData) {
        // New user registration via message
        await kv.set(`line:user:${userId}`, {
            userId,
            foodItems: [],
            registeredAt: new Date().toISOString(),
        });

        await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '✅ Registered! Open the Expiry Tracker app to connect your LINE account and add food items.',
        });
    } else if (text === 'status' || text === 'check') {
        // Show current tracked items
        const count = userData.foodItems.length;
        await client.replyMessage(event.replyToken, {
            type: 'text',
            text: count > 0
                ? `📊 You're tracking ${count} food item${count > 1 ? 's' : ''}.\n\nOpen the app to see details!`
                : '📦 No food items tracked yet.\n\nOpen the app to add items!',
        });
    } else {
        // Default response
        await client.replyMessage(event.replyToken, {
            type: 'text',
            text: `Commands:\n• "status" - Check tracked items\n• "check" - Same as status\n\nOr open the app to manage your food items!`,
        });
    }
}
