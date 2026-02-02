'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import type { FoodItem } from '@/types';
import { useEffect } from 'react';

interface NotificationSetupProps {
    foodItems: FoodItem[];
}

export function NotificationSetup({ foodItems }: NotificationSetupProps) {
    const {
        isSupported,
        permission,
        subscription,
        isLoading,
        error,
        subscribe,
        updateFoodItems,
    } = usePushNotifications();

    // Update food items on server when they change
    useEffect(() => {
        if (subscription && foodItems.length > 0) {
            updateFoodItems(foodItems);
        }
    }, [foodItems, subscription, updateFoodItems]);

    if (!isSupported) {
        return (
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                <div className="flex items-center gap-3 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <span className="text-sm">Push notifications not supported in this browser</span>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 animate-pulse">
                <div className="flex items-center gap-3 text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-gray-600"></div>
                    <span className="text-sm">Checking notification status...</span>
                </div>
            </div>
        );
    }

    if (permission === 'granted' && subscription) {
        return (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-3 text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="text-sm font-medium">Notifications enabled! You&apos;ll be reminded about expiring food.</span>
                </div>
            </div>
        );
    }

    if (permission === 'denied') {
        return (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-3 text-red-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <span className="text-sm">Notifications blocked. Please enable them in your browser settings.</span>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => subscribe(foodItems)}
            disabled={isLoading}
            className="
        w-full p-4 rounded-xl
        bg-gradient-to-r from-amber-500/20 to-orange-500/20
        border border-amber-500/30 hover:border-amber-400/50
        text-amber-300 hover:text-amber-200
        transition-all duration-200
        flex items-center justify-center gap-3
        group
      "
        >
            <svg
                className="w-5 h-5 group-hover:animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="font-medium">
                {error ? 'Retry Enable Notifications' : 'Enable Expiry Reminders'}
            </span>
        </button>
    );
}
