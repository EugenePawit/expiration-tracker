'use client';

import { useEffect, useState } from 'react';
import type { FoodItem } from '@/types';

// Declare OneSignal global type
declare global {
    interface Window {
        OneSignal: any;
    }
}

interface NotificationSetupProps {
    foodItems: FoodItem[];
    onSubscriptionChange?: (subscribed: boolean) => void;
    compact?: boolean; // Show as small bell icon in header
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
        if (isInitialized && isSubscribed && foodItems) {
            syncFoodItems();
        }
    }, [isInitialized, isSubscribed, foodItems]);

    async function syncFoodItems() {
        try {
            if (!window.OneSignal) {
                console.warn('[OneSignal] SDK not loaded yet');
                return;
            }
            await window.OneSignal.User.addTags({
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

            // Wait for OneSignal to load
            if (!window.OneSignal) {
                console.log('[OneSignal] Waiting for SDK to load...');
                await new Promise((resolve) => {
                    const checkInterval = setInterval(() => {
                        if (window.OneSignal) {
                            clearInterval(checkInterval);
                            resolve(true);
                        }
                    }, 100);
                    // Timeout after 10 seconds
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        resolve(false);
                    }, 10000);
                });
            }

            if (!window.OneSignal) {
                throw new Error('OneSignal SDK failed to load');
            }

            await window.OneSignal.init({
                appId,
                allowLocalhostAsSecureOrigin: true,
            });

            setIsInitialized(true);

            // Check current subscription status
            const isPushSupported = window.OneSignal.Notifications.isPushSupported();
            if (isPushSupported) {
                const permission = await window.OneSignal.Notifications.permissionNative;
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
            if (!window.OneSignal) {
                throw new Error('OneSignal not loaded');
            }

            // Request permission
            await window.OneSignal.Notifications.requestPermission();

            // Check if permission was granted
            const permission = await window.OneSignal.Notifications.permissionNative;
            const subscribed = permission === 'granted';

            setIsSubscribed(subscribed);
            onSubscriptionChange?.(subscribed);

            if (subscribed) {
                // Tag user with initial empty food items array
                await window.OneSignal.User.addTags({
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
        // In compact mode, show loading icon
        if (compact) {
            return (
                <div className="w-10 h-10 rounded-full bg-gray-700/50 border border-gray-600/50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                    </svg>
                </div>
            );
        }
        return null; // Full mode - hide until ready
    }

    // Compact mode for header (bell icon only)
    if (compact) {
        if (isSubscribed) {
            return (
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                    </div>
                    {/* Active indicator */}
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
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
            </button>
        );
    }

    // Full mode for main content area
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
