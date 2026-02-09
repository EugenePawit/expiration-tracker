'use client';

import { useEffect, useState } from 'react';

interface NotificationSetupProps {
    compact?: boolean;
}

export function NotificationSetup({ compact = false }: NotificationSetupProps) {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkSupport();
    }, []);

    async function checkSupport() {
        try {
            const supported = 'serviceWorker' in navigator && 'PushManager' in window;
            setIsSupported(supported);

            if (!supported) {
                setError('Push notifications not supported');
                setIsLoading(false);
                return;
            }

            // Register service worker
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('[Push] Service worker registered');

            // Check existing subscription
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
            console.log('[Push] Existing subscription:', !!subscription);
        } catch (err) {
            console.error('[Push] Setup error:', err);
            setError('Failed to initialize notifications');
        } finally {
            setIsLoading(false);
        }
    }

    async function subscribe() {
        setIsLoading(true);
        setError(null);

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setError('Permission denied');
                setIsLoading(false);
                return;
            }

            const registration = await navigator.serviceWorker.ready;

            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidKey) {
                throw new Error('VAPID key not configured');
            }

            // Convert VAPID key to Uint8Array
            const urlBase64ToUint8Array = (base64String: string) => {
                const padding = '='.repeat((4 - base64String.length % 4) % 4);
                const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
                const rawData = window.atob(base64);
                const outputArray = new Uint8Array(rawData.length);
                for (let i = 0; i < rawData.length; ++i) {
                    outputArray[i] = rawData.charCodeAt(i);
                }
                return outputArray;
            };

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });

            console.log('[Push] Subscribed:', subscription);

            // Save to backend
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription.toJSON())
            });

            if (!response.ok) {
                throw new Error('Failed to save subscription');
            }

            setIsSubscribed(true);
            console.log('[Push] Subscription saved to backend');
        } catch (err) {
            console.error('[Push] Subscribe error:', err);
            setError(err instanceof Error ? err.message : 'Failed to subscribe');
        } finally {
            setIsLoading(false);
        }
    }

    async function unsubscribe() {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Remove from backend
                await fetch('/api/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });
            }

            setIsSubscribed(false);
        } catch (err) {
            console.error('[Push] Unsubscribe error:', err);
        } finally {
            setIsLoading(false);
        }
    }

    // Loading state
    if (isLoading) {
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
        if (!isSupported || error) {
            return (
                <div className="relative" title={error || 'Not supported'}>
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
                <button onClick={unsubscribe} title="Notifications enabled - click to disable" className="relative">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-500/30 transition-colors">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-900"></div>
                </button>
            );
        }

        return (
            <button
                onClick={subscribe}
                title="Enable push notifications"
                className="w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 hover:border-gray-500/50 flex items-center justify-center transition-all"
            >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </button>
        );
    }

    // Full mode (not used anymore, but keeping for backwards compat)
    return null;
}
