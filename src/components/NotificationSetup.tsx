'use client';

import { useEffect, useState } from 'react';
import OneSignalReact from 'react-onesignal';
import type { FoodItem } from '@/types';

interface NotificationSetupProps {
    foodItems: FoodItem[];
    onSubscriptionChange?: (subscribed: boolean) => void;
}

export function NotificationSetup({ foodItems, onSubscriptionChange }: NotificationSetupProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        initOneSignal();
    }, []);

    // Sync food items to OneSignal tags whenever they change
    useEffect(() => {
        if (isInitialized && isSubscribed && foodItems) {
            syncFoodItems();
        }
    }, [isInitialized, isSubscribed, foodItems]);

    async function syncFoodItems() {
        try {
            await OneSignalReact.User.addTags({
                foodItems: JSON.stringify(foodItems),
            });
            console.log('[OneSignal] Food items synced to tags');
        } catch (err) {
            console.error('[OneSignal] Failed to sync food items:', err);
        }
    }

    async function initOneSignal() {
        try {
            const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
            if (!appId) {
                console.error('OneSignal App ID not found');
                return;
            }

            await OneSignalReact.init({
                appId,
                allowLocalhostAsSecureOrigin: true,
            });

            setIsInitialized(true);

            // Check current subscription status
            const isPushSupported = OneSignalReact.Notifications.isPushSupported();
            if (isPushSupported) {
                const permission = await OneSignalReact.Notifications.permissionNative;
                setIsSubscribed(permission === 'granted');
            }
        } catch (err) {
            console.error('OneSignal initialization error:', err);
            setError('Failed to initialize notifications');
        }
    }

    async function handleEnableNotifications() {
        setIsLoading(true);
        setError(null);

        try {
            // Request permission
            await OneSignalReact.Notifications.requestPermission();

            // Check if permission was granted
            const permission = await OneSignalReact.Notifications.permissionNative;
            const subscribed = permission === 'granted';

            setIsSubscribed(subscribed);
            onSubscriptionChange?.(subscribed);

            if (subscribed) {
                // Tag user with initial empty food items array
                await OneSignalReact.User.addTags({
                    foodItems: JSON.stringify([]),
                });
            }
        } catch (err) {
            console.error('Error requesting notification permission:', err);
            setError('Failed to enable notifications');
        } finally {
            setIsLoading(false);
        }
    }

    if (!isInitialized) {
        return null; // Or a loading state
    }

    if (isSubscribed) {
        return (
            <div className="w-full p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-emerald-300 font-medium">Notifications Enabled</p>
                        <p className="text-sm text-emerald-300/70">You'll get reminders for expiring food!</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="
                    w-full py-4 px-6 rounded-2xl
                    bg-gradient-to-r from-amber-500 to-orange-500
                    hover:from-amber-400 hover:to-orange-400
                    disabled:opacity-50 disabled:cursor-not-allowed
                    text-white font-semibold text-lg
                    shadow-lg shadow-amber-500/25
                    hover:shadow-xl hover:shadow-amber-500/30
                    transition-all duration-300 hover:scale-[1.02]
                    flex items-center justify-center gap-3
                "
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {isLoading ? 'Enabling...' : 'Enable Expiry Reminders'}
            </button>
            {error && (
                <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
        </div>
    );
}
