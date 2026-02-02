// Food item stored in LocalStorage
export interface FoodItem {
  id: string;
  name: string;
  expiryDate: string; // ISO date string (YYYY-MM-DD)
  createdAt: string;
}

// Push subscription with user data
export interface UserSubscription {
  id: string;
  subscription: PushSubscription;
  foodItems: FoodItem[];
  createdAt: string;
  updatedAt: string;
}

// Serialized push subscription for API
export interface SerializedPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Expiry status for color coding
export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'safe';

// Helper to get expiry status
export function getExpiryStatus(expiryDate: string): ExpiryStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays < 2) return 'critical';
  if (diffDays < 4) return 'warning';
  return 'safe';
}

// Helper to get days remaining
export function getDaysRemaining(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
