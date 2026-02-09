'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import type { FoodItem } from '@/types';

interface NotificationSetupProps {
    foodItems: FoodItem[];
    onSubscriptionChange?: (subscribed: boolean) => void;
}

export function NotificationSetup({ foodItems, onSubscriptionChange }: NotificationSetupProps) {
    const [lineUserId, setLineUserId] = useState<string | null>(null);
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        // Check if user has LINE connected
        const storedUserId = localStorage.getItem('lineUserId');
        if (storedUserId) {
            setLineUserId(storedUserId);
            onSubscriptionChange?.(true);
        }
    }, [onSubscriptionChange]);

    // Sync food items to server whenever they change
    useEffect(() => {
        if (lineUserId && foodItems) {
            syncFoodItems();
        }
    }, [lineUserId, foodItems]);

    async function syncFoodItems() {
        if (!lineUserId) return;

        try {
            await fetch('/api/line-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: lineUserId,
                    foodItems,
                }),
            });
            console.log('[LINE] Food items synced');
        } catch (error) {
            console.error('[LINE] Failed to sync food items:', error);
        }
    }

    // LINE Official Account URL (replace with your actual LINE@ URL)
    const lineAddUrl = 'https://lin.ee/YOUR_LINE_ID'; // TODO: Replace with actual URL

    if (lineUserId) {
        return (
            <div className="w-full p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-emerald-300 font-medium">LINE Reminders Active</p>
                        <p className="text-sm text-emerald-300/70">You'll receive daily notifications via LINE!</p>
                    </div>
                    <button
                        onClick={() => {
                            if (confirm('Disconnect LINE notifications?')) {
                                localStorage.removeItem('lineUserId');
                                setLineUserId(null);
                                onSubscriptionChange?.(false);
                            }
                        }}
                        className="text-emerald-300/50 hover:text-emerald-300 text-sm"
                    >
                        Disconnect
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-3">
            <button
                onClick={() => setShowQR(!showQR)}
                className="
                    w-full py-4 px-6 rounded-2xl
                    bg-gradient-to-r from-green-500 to-emerald-500
                    hover:from-green-400 hover:to-emerald-400
                    text-white font-semibold text-lg
                    shadow-lg shadow-green-500/25
                    hover:shadow-xl hover:shadow-green-500/30
                    transition-all duration-300 hover:scale-[1.02]
                    flex items-center justify-center gap-3
                "
            >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                {showQR ? 'Hide QR Code' : 'Enable LINE Reminders'}
            </button>

            {showQR && (
                <div className="p-6 rounded-2xl bg-gray-800/50 border border-white/10 space-y-4">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-white mb-2">Connect with LINE</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Scan this QR code with your LINE app to receive daily reminders
                        </p>
                    </div>

                    <div className="flex justify-center p-4 bg-white rounded-xl">
                        <QRCode value={lineAddUrl} size={200} />
                    </div>

                    <div className="space-y-2 text-sm text-gray-400">
                        <p className="font-medium text-white">Instructions:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Open LINE app on your phone</li>
                            <li>Tap the QR code scanner</li>
                            <li>Scan the code above</li>
                            <li>Add the bot as a friend</li>
                            <li>Send any message to activate</li>
                        </ol>
                    </div>

                    <button
                        onClick={() => {
                            const testUserId = prompt('Paste your LINE User ID (for testing):');
                            if (testUserId) {
                                localStorage.setItem('lineUserId', testUserId);
                                setLineUserId(testUserId);
                                onSubscriptionChange?.(true);
                            }
                        }}
                        className="w-full py-2 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm"
                    >
                        Manual Setup (For Testing)
                    </button>
                </div>
            )}
        </div>
    );
}
