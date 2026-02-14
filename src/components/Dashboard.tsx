'use client';

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { FoodItem } from '@/types';
import { getExpiryStatus } from '@/types';
import { FoodItemCard } from './FoodItemCard';
import { AddItemForm } from './AddItemForm';
import { NotificationSetup } from './NotificationSetup';

export function Dashboard() {
    const { value: items, setValue: setItems, isLoaded } = useLocalStorage<FoodItem[]>('food-items', []);

    // Sort items by expiry date (soonest first)
    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) =>
            new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        );
    }, [items]);

    // Count by status
    const statusCounts = useMemo(() => {
        return items.reduce((acc, item) => {
            const status = getExpiryStatus(item.expiryDate);
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [items]);

    const handleAddItem = useCallback((item: FoodItem) => {
        setItems(prev => [...prev, item]);
    }, [setItems]);

    const handleDeleteItem = useCallback((id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    }, [setItems]);

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-900/80 border-b border-white/10">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🍎</span>
                            <div>
                                <h1 className="text-xl font-bold text-white">Expiry Tracker</h1>
                                <p className="text-xs text-gray-400">
                                    {items.length} item{items.length !== 1 ? 's' : ''} tracked
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Notification Icon */}
                            <NotificationSetup compact items={items} />

                            {/* Status badges */}
                            {items.length > 0 && (
                                <div className="flex gap-2">
                                    {(statusCounts.expired || 0) + (statusCounts.critical || 0) > 0 && (
                                        <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
                                            {(statusCounts.expired || 0) + (statusCounts.critical || 0)} urgent
                                        </span>
                                    )}
                                    {statusCounts.warning > 0 && (
                                        <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                                            {statusCounts.warning} soon
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Add Item Form */}
                <AddItemForm onAdd={handleAddItem} />

                {/* Items List */}
                {items.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🥡</div>
                        <h2 className="text-xl font-semibold text-gray-300 mb-2">No items yet</h2>
                        <p className="text-gray-500">Add your first food item to start tracking expiry dates.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider px-1">
                            Your Items
                        </h2>
                        <div className="grid gap-3">
                            {sortedItems.map(item => (
                                <FoodItemCard
                                    key={item.id}
                                    item={item}
                                    onDelete={handleDeleteItem}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* PWA Install Hint */}
                <div className="text-center text-xs text-gray-500 py-4">
                    <p>💡 Add to Home Screen for notifications when your browser is closed</p>
                </div>
            </main>
        </div>
    );
}
