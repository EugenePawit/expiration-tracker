'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FoodItem, SerializedPushSubscription } from '@/types';

interface PushNotificationState {
    isSupported: boolean;
    permission: NotificationPermission | 'unsupported';
    subscription: PushSubscription | null;
    isLoading: boolean;
    error: string | null;
}

export function usePushNotifications() {
    const [state, setState] = useState<PushNotificationState>({
        isSupported: false,
        permission: 'unsupported',
        subscription: null,
        isLoading: true,
        error: null,
    });

    // Check support and current state on mount
    useEffect(() => {
        const checkSupport = async () => {
            const isSupported =
                'serviceWorker' in navigator &&
                'PushManager' in window &&
                'Notification' in window;

            if (!isSupported) {
                setState(prev => ({
                    ...prev,
                    isSupported: false,
                    permission: 'unsupported',
                    isLoading: false
                }));
                return;
            }

            try {
                // Register service worker
                const registration = await navigator.serviceWorker.register('/sw.js');
                await navigator.serviceWorker.ready;

                // Check existing subscription
                const existingSubscription = await registration.pushManager.getSubscription();

                setState({
                    isSupported: true,
                    permission: Notification.permission,
                    subscription: existingSubscription,
                    isLoading: false,
                    error: null,
                });
            } catch (error) {
                console.error('Error checking push support:', error);
                setState(prev => ({
                    ...prev,
                    isSupported: true,
                    permission: Notification.permission,
                    isLoading: false,
                    error: 'Failed to register service worker'
                }));
            }
        };

        checkSupport();
    }, []);

    // Subscribe to push notifications
    const subscribe = useCallback(async (foodItems: FoodItem[]) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Request notification permission
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                setState(prev => ({
                    ...prev,
                    permission,
                    isLoading: false,
                    error: 'Notification permission denied'
                }));
                return null;
            }

            // Get VAPID public key from server
            const vapidResponse = await fetch('/api/vapid-key');
            if (!vapidResponse.ok) {
                throw new Error('Failed to get VAPID key');
            }
            const { publicKey } = await vapidResponse.json();

            // Get push subscription
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });

            // Serialize subscription for API
            const serialized: SerializedPushSubscription = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
                    auth: arrayBufferToBase64(subscription.getKey('auth')!),
                },
            };

            // Send subscription to server with food items
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: serialized, foodItems }),
            });

            if (!response.ok) {
                throw new Error('Failed to save subscription');
            }

            setState({
                isSupported: true,
                permission: 'granted',
                subscription,
                isLoading: false,
                error: null,
            });

            return subscription;
        } catch (error) {
            console.error('Error subscribing to push:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to subscribe'
            }));
            return null;
        }
    }, []);

    // Update food items on server
    const updateFoodItems = useCallback(async (foodItems: FoodItem[]) => {
        if (!state.subscription) return;

        try {
            const serialized: SerializedPushSubscription = {
                endpoint: state.subscription.endpoint,
                keys: {
                    p256dh: arrayBufferToBase64(state.subscription.getKey('p256dh')!),
                    auth: arrayBufferToBase64(state.subscription.getKey('auth')!),
                },
            };

            await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: serialized, foodItems }),
            });
        } catch (error) {
            console.error('Error updating food items:', error);
        }
    }, [state.subscription]);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async () => {
        if (!state.subscription) return;

        setState(prev => ({ ...prev, isLoading: true }));

        try {
            await state.subscription.unsubscribe();

            // TODO: Remove subscription from server

            setState(prev => ({
                ...prev,
                subscription: null,
                isLoading: false
            }));
        } catch (error) {
            console.error('Error unsubscribing:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Failed to unsubscribe'
            }));
        }
    }, [state.subscription]);

    return {
        ...state,
        subscribe,
        unsubscribe,
        updateFoodItems,
    };
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray as Uint8Array<ArrayBuffer>;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
