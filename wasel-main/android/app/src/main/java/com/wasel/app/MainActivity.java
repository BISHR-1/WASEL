package com.wasel.app;

import android.os.Build;
import android.os.Bundle;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.util.Log;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "WaselApp";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register the PushNotifications plugin
        registerPlugin(PushNotificationsPlugin.class);
        
        // Create the notification channel (required for Android 8+)
        createNotificationChannel();
        
        // Subscribe to topics for broadcast notifications
        subscribeToTopics();

        // Allow camera access in WebView
        getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }
        });
    }
    
    private void subscribeToTopics() {
        // Subscribe to "all_users" topic - for notifications to all users
        FirebaseMessaging.getInstance().subscribeToTopic("all_users")
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    Log.d(TAG, "✅ Subscribed to 'all_users' topic");
                } else {
                    Log.e(TAG, "❌ Failed to subscribe to 'all_users' topic");
                }
            });
        
        // Subscribe to "promotions" topic - for promotional offers
        FirebaseMessaging.getInstance().subscribeToTopic("promotions")
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    Log.d(TAG, "✅ Subscribed to 'promotions' topic");
                } else {
                    Log.e(TAG, "❌ Failed to subscribe to 'promotions' topic");
                }
            });
        
        // Subscribe to "orders" topic - for order updates
        FirebaseMessaging.getInstance().subscribeToTopic("orders")
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    Log.d(TAG, "✅ Subscribed to 'orders' topic");
                } else {
                    Log.e(TAG, "❌ Failed to subscribe to 'orders' topic");
                }
            });
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            String channelId = "wasel_notifications";
            String channelName = getString(R.string.notification_channel_name);
            String channelDescription = getString(R.string.notification_channel_description);
            int importance = NotificationManager.IMPORTANCE_HIGH;
            
            NotificationChannel channel = new NotificationChannel(channelId, channelName, importance);
            channel.setDescription(channelDescription);
            channel.enableLights(true);
            channel.enableVibration(true);
            channel.setShowBadge(true);
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }
}
