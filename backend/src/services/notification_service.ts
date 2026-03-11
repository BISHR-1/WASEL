
import { fcm } from '../utils/firebase';

export interface AlertPayload {
    title: string;
    body: string;
    data?: { [key: string]: string };
}

export class NotificationService {

    /**
     * Sends a critical alert to the admin/owner topic.
     */
    static async sendAdminAlert(payload: AlertPayload) {
        try {
            // Send to a topic that the admin device is subscribed to
            // This is more reliable than managing specific tokens for alerting
            const message = {
                notification: {
                    title: `🚨 ${payload.title}`,
                    body: payload.body
                },
                data: payload.data || {},
                topic: 'admin_alerts'
            };

            const response = await fcm.send(message);
            console.log('✅ Admin Alert Sent:', response);
        } catch (error) {
            console.error('❌ Failed to send Admin Alert:', error);
        }
    }

    /**
     * Send order update to a specific user.
     */
    static async sendUserNotification(userId: string, title: string, body: string) {
        // Here we would look up the user's FCM token from the database
        // const { data } = await supabaseAdmin.from('user_devices').select('fcm_token').eq('user_id', userId);
        // ... implementation depends on user_devices table
        console.log(`[Mock] Sending notification to user ${userId}: ${title}`);
    }
}
