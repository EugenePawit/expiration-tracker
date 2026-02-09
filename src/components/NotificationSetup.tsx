'use client';

import { useEffect, useState } from 'react';
import OneSignalReact from 'react-onesignal';
import type { FoodItem } from '@/types';

interface NotificationSetupProps {
    foodItems: FoodItem[];
    onSubscriptionChange?: (subscribed: boolean) => void;
    compact?: boolean;
}

export function NotificationSetup({ foodItems, onSubscriptionChange, compact = false }: NotificationSetupProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        initOneSignal();
    }, []);

    // Sync food items to OneSignal tags whenever they change
    useEffect(() => {
        if (isInitialized && isSubscribed && foodItems.length >= 0) {
            syncFoodItems();
        }
    }, [foodItems, isInitialized, isSubscribed]);

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
            console.log('[OneSignal] Starting initialization...');
            const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
            if (!appId) {
                console.error('[OneSignal] App ID not found');
                setError('OneSignal not configured');
                setIsInitialized(true);
                return;
            }

            console.log('[OneSignal] Calling init with App ID');
            await OneSignalReact.init({
                appId,
                allowLocalhostAsSecureOrigin: true,
            });

            console.log('[OneSignal] Init complete');
            setIsInitialized(true);

            // Check subscription status
            const isPushSupported = OneSignalReact.Notifications.isPushSupported();
            console.log('[OneSignal] Push supported:', isPushSupported);

            if (isPushSupported) {
                const permission = await OneSignalReact.Notifications.permissionNative;
                console.log('[OneSignal] Permission:', permission);
                setIsSubscribed(permission === 'granted');
            }
        } catch (err) {
            console.error('[OneSignal] Init error:', err);
            setError(err instanceof Error ? err.message : 'Failed to initialize');
            setIsInitialized(true);
        }
    }

    async function handleEnableNotifications() {
        setIsLoading(true);
        setError(null);

        try {
            await OneSignalReact.Notifications.requestPermission();
            const permission = await OneSignalReact.Notifications.permissionNative;
            const subscribed = permission === 'granted';

            setIsSubscribed(subscribed);
            onSubscriptionChange?.(subscribed);

            if (subscribed) {
                await OneSignalReact.User.addTags({
                    foodItems: JSON.stringify(foodItems),
                });
            }
        } catch (err) {
            console.error('[OneSignal] Permission error:', err);
            setError('Failed to enable notifications');
        } finally {
            setIsLoading(false);
        }
    }

    // Loading state
    if (!isInitialized) {
        if (compact) {
            return (
                <div className="w-10 h-10 rounded-full bg-gray-700/50 border border-gray-600/50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </div>
            );
        }
        return null;
    }

    // Compact mode (header bell icon)
    if (compact) {
        if (error) {
            return (
                <div className="relative" title={error}>
                    <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900"></div>
                </div>
            );
        }

        if (isSubscribed) {
            return (
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-900"></div>
                </div>
            );
        }

        return (
            <button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                title="Enable push notifications"
                className="w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 hover:border-gray-500/50 flex items-center justify-center transition-all disabled:opacity-50"
            >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </button>
        );
    }

    // Full mode (card view)
    if (isSubscribed) {
        return (
            <div className="w-full p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-emerald-400">Notifications Enabled</h3>
                        <p className="text-xs text-emerald-400/70">You'll receive expiry reminders</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full p-4 rounded-2xl bg-gray-800/50 border border-gray-700/50">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-200">Enable Expiry Reminders</h3>
                    <p className="text-xs text-gray-400">Get notified when food is about to expire</p>
                </div>
            </div>

            {error && (
                <p className="text-xs text-red-400 mb-2">
                    {error}
                </p>
            )}

            <button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </button>
        </div>
    );
}
