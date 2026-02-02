'use client';

import { useState } from 'react';
import { type FoodItem, getExpiryStatus, getDaysRemaining } from '@/types';

interface FoodItemCardProps {
    item: FoodItem;
    onDelete: (id: string) => void;
}

export function FoodItemCard({ item, onDelete }: FoodItemCardProps) {
    const [isCompleting, setIsCompleting] = useState(false);
    const status = getExpiryStatus(item.expiryDate);
    const daysRemaining = getDaysRemaining(item.expiryDate);

    const statusConfig = {
        expired: {
            bg: 'bg-gradient-to-br from-red-500/20 to-red-600/10',
            border: 'border-red-500/50',
            badge: 'bg-red-500 text-white',
            text: 'Expired!',
            glow: 'shadow-red-500/20',
        },
        critical: {
            bg: 'bg-gradient-to-br from-red-500/15 to-orange-500/10',
            border: 'border-red-400/50',
            badge: 'bg-red-500 text-white',
            text: daysRemaining === 0 ? 'Today!' : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
            glow: 'shadow-red-400/20',
        },
        warning: {
            bg: 'bg-gradient-to-br from-amber-500/15 to-orange-400/10',
            border: 'border-amber-400/50',
            badge: 'bg-amber-500 text-white',
            text: `${daysRemaining} days`,
            glow: 'shadow-amber-400/20',
        },
        safe: {
            bg: 'bg-gradient-to-br from-emerald-500/15 to-green-400/10',
            border: 'border-emerald-400/50',
            badge: 'bg-emerald-500 text-white',
            text: `${daysRemaining} days`,
            glow: 'shadow-emerald-400/20',
        },
    };

    const config = statusConfig[status];

    const formattedDate = new Date(item.expiryDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

    const handleComplete = () => {
        setIsCompleting(true);
        // Wait for animation, then delete
        setTimeout(() => {
            onDelete(item.id);
        }, 400);
    };

    return (
        <div
            className={`
                relative group rounded-2xl border-2 p-4 flex items-start gap-3
                ${config.bg} ${config.border} ${config.glow}
                shadow-lg transition-all duration-300
                ${isCompleting ? 'opacity-0 scale-95 -translate-x-4' : 'hover:shadow-xl hover:scale-[1.02]'}
                backdrop-blur-sm
            `}
        >
            {/* Checkbox */}
            <button
                onClick={handleComplete}
                disabled={isCompleting}
                className={`
                    flex-shrink-0 w-6 h-6 mt-0.5 rounded-md border-2
                    flex items-center justify-center
                    transition-all duration-200
                    ${isCompleting
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-gray-400 hover:border-emerald-400 hover:bg-emerald-500/20'
                    }
                `}
                aria-label="Mark as used/complete"
            >
                {isCompleting && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Food name */}
                <h3 className={`text-lg font-semibold text-white mb-2 ${isCompleting ? 'line-through opacity-50' : ''}`}>
                    {item.name}
                </h3>

                {/* Expiry info */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">
                        {formattedDate}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.badge}`}>
                        {config.text}
                    </span>
                </div>
            </div>
        </div>
    );
}

