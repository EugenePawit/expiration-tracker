'use client';

import { type FoodItem, getExpiryStatus, getDaysRemaining } from '@/types';

interface FoodItemCardProps {
    item: FoodItem;
    onDelete: (id: string) => void;
}

export function FoodItemCard({ item, onDelete }: FoodItemCardProps) {
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

    return (
        <div
            className={`
        relative group rounded-2xl border-2 p-4 
        ${config.bg} ${config.border} ${config.glow}
        shadow-lg hover:shadow-xl transition-all duration-300
        hover:scale-[1.02] backdrop-blur-sm
      `}
        >
            {/* Delete button */}
            <button
                onClick={() => onDelete(item.id)}
                className="
          absolute top-3 right-3 w-8 h-8 rounded-full
          bg-white/10 hover:bg-red-500 
          flex items-center justify-center
          text-gray-400 hover:text-white
          transition-all duration-200
          opacity-0 group-hover:opacity-100
        "
                aria-label="Delete item"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Food name */}
            <h3 className="text-lg font-semibold text-white mb-2 pr-8">
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
    );
}
