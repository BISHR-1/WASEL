-- =====================================================
-- جدول لحفظ FCM Tokens للإشعارات
-- =====================================================

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL,
    platform TEXT DEFAULT 'android', -- android, ios, web
    device_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- كل مستخدم له token واحد فقط لكل منصة
    UNIQUE(user_id, platform)
);

-- فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_fcm_token ON user_devices(fcm_token);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON user_devices(is_active) WHERE is_active = true;

-- تفعيل RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- السياسات
CREATE POLICY "Users can view own devices" ON user_devices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices" ON user_devices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices" ON user_devices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices" ON user_devices
    FOR DELETE USING (auth.uid() = user_id);

-- السماح للـ service role بالوصول الكامل (للإرسال من الخادم)
CREATE POLICY "Service role full access" ON user_devices
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- جدول لتاريخ الإشعارات المرسلة
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}',
    type TEXT, -- order_update, promotion, etc.
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- فهرس
CREATE INDEX IF NOT EXISTS idx_notification_history_user ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_unread ON notification_history(user_id, is_read) WHERE is_read = false;

-- RLS
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notification_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notification_history
    FOR UPDATE USING (auth.uid() = user_id);
