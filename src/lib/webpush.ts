import webpush from 'web-push';
import type { SerializedPushSubscription, FoodItem } from '@/types';

// In-memory storage for MVP
// In production, replace with Upstash Redis or similar
const subscriptions = new Map<string, {
    subscription: SerializedPushSubscription;
    foodItems: FoodItem[];
    updatedAt: string;
}>();

// Initialize web-push with VAPID keys
function initWebPush() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.VAPID_EMAIL || 'mailto:admin@example.com';

    if (!publicKey || !privateKey) {
        throw new Error('VAPID keys not configured');
    }

    webpush.setVapidDetails(email, publicKey, privateKey);
}

export function saveSubscription(
    subscription: SerializedPushSubscription,
    foodItems: FoodItem[]
): void {
    const key = subscription.endpoint;
    subscriptions.set(key, {
        subscription,
        foodItems,
        updatedAt: new Date().toISOString(),
    });
    console.log(`[WebPush] Subscription saved. Total subscriptions: ${subscriptions.size}, Food items: ${foodItems.length}`);
}

export function getAllSubscriptions(): Array<{
    subscription: SerializedPushSubscription;
    foodItems: FoodItem[];
}> {
    const allSubs = Array.from(subscriptions.values());
    console.log(`[WebPush] Getting all subscriptions. Count: ${allSubs.length}`);
    return allSubs;
}

export function removeSubscription(endpoint: string): void {
    subscriptions.delete(endpoint);
}

export async function sendPushNotification(
    subscription: SerializedPushSubscription,
    payload: { title: string; body: string; url?: string }
): Promise<boolean> {
    try {
        console.log(`[WebPush] Attempting to send notification: ${payload.title}`);
        initWebPush();

        const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
        };

        await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload)
        );

        console.log(`[WebPush] ✅ Notification sent successfully`);
        return true;
    } catch (error: unknown) {
        console.error('[WebPush] ❌ Error sending push notification:', error);

        // If subscription is no longer valid, remove it
        if (error instanceof Error && 'statusCode' in error) {
            const statusCode = (error as { statusCode: number }).statusCode;
            console.log(`[WebPush] Status code: ${statusCode}`);
            if (statusCode === 404 || statusCode === 410) {
                console.log(`[WebPush] Removing expired subscription`);
                removeSubscription(subscription.endpoint);
            }
        }

        return false;
    }
}
