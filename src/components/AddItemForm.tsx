'use client';

import { useState } from 'react';
import type { FoodItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AddItemFormProps {
    onAdd: (item: FoodItem) => void;
}

export function AddItemForm({ onAdd }: AddItemFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get today's date in YYYY-MM-DD format for min date
    const today = new Date().toISOString().split('T')[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !expiryDate) return;

        // Test notification feature
        if (name.trim().toLowerCase() === 'testnoti') {
            setIsSubmitting(true);

            // Check if notifications are supported and permitted
            if (!('Notification' in window)) {
                alert('Notifications not supported in this browser');
                setIsSubmitting(false);
                return;
            }

            if (Notification.permission !== 'granted') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    alert('Please enable notifications first');
                    setIsSubmitting(false);
                    return;
                }
            }

            // Reset form immediately
            setName('');
            setExpiryDate('');
            setIsOpen(false);
            setIsSubmitting(false);

            // Send test notification after 5 seconds
            setTimeout(() => {
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    // Use service worker to show notification (works in background)
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification('🧪 Test Notification!', {
                            body: 'This is a test notification from Expiry Tracker. If you see this, push notifications are working!',
                            icon: '/icons/icon-192.png',
                            badge: '/icons/badge-72.png',
                            tag: 'test-notification',
                            requireInteraction: true,
                        });
                    });
                } else {
                    // Fallback to regular notification
                    new Notification('🧪 Test Notification!', {
                        body: 'This is a test notification from Expiry Tracker.',
                        icon: '/icons/icon-192.png',
                    });
                }
            }, 5000);

            return;
        }

        setIsSubmitting(true);

        const newItem: FoodItem = {
            id: uuidv4(),
            name: name.trim(),
            expiryDate,
            createdAt: new Date().toISOString(),
        };

        onAdd(newItem);

        // Reset form with animation delay
        setTimeout(() => {
            setName('');
            setExpiryDate('');
            setIsOpen(false);
            setIsSubmitting(false);
        }, 200);
    };

    return (
        <div className="w-full">
            {/* Add Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="
            w-full py-4 px-6 rounded-2xl
            bg-gradient-to-r from-violet-600 to-indigo-600
            hover:from-violet-500 hover:to-indigo-500
            text-white font-semibold text-lg
            shadow-lg shadow-violet-500/25
            hover:shadow-xl hover:shadow-violet-500/30
            transition-all duration-300 hover:scale-[1.02]
            flex items-center justify-center gap-3
          "
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Food Item
                </button>
            )}

            {/* Form */}
            {isOpen && (
                <form
                    onSubmit={handleSubmit}
                    className="
            bg-white/5 backdrop-blur-xl rounded-2xl p-6
            border border-white/10 shadow-2xl
            animate-in slide-in-from-top-2 duration-300
          "
                >
                    <div className="space-y-4">
                        {/* Food Name Input */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                Food Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Milk, Eggs, Yogurt..."
                                required
                                className="
                  w-full px-4 py-3 rounded-xl
                  bg-white/10 border border-white/20
                  text-white placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                  transition-all duration-200
                "
                            />
                        </div>

                        {/* Expiry Date Input */}
                        <div>
                            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-300 mb-2">
                                Expiry Date
                            </label>
                            <input
                                type="date"
                                id="expiryDate"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                min={today}
                                required
                                className="
                  w-full px-4 py-3 rounded-xl
                  bg-white/10 border border-white/20
                  text-white
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                  transition-all duration-200
                  [color-scheme:dark]
                "
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="
                  flex-1 py-3 px-4 rounded-xl
                  bg-white/10 hover:bg-white/20
                  text-gray-300 font-medium
                  transition-all duration-200
                "
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !name.trim() || !expiryDate}
                                className="
                  flex-1 py-3 px-4 rounded-xl
                  bg-gradient-to-r from-violet-600 to-indigo-600
                  hover:from-violet-500 hover:to-indigo-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  text-white font-semibold
                  shadow-lg shadow-violet-500/25
                  transition-all duration-200
                "
                            >
                                {isSubmitting ? 'Adding...' : 'Add Item'}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}
