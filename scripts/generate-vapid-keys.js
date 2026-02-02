// Generate VAPID keys for Web Push notifications
// Run with: node scripts/generate-vapid-keys.js

const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n🔐 VAPID Keys Generated!\n');
console.log('Add these to your .env.local file:\n');
console.log('─'.repeat(60));
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('─'.repeat(60));
console.log('\nAlso add your email:');
console.log('VAPID_EMAIL=mailto:your-email@example.com\n');
