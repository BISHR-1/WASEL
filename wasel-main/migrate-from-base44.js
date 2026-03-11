/**
 * سكربت نقل البيانات من Base44 إلى Supabase
 * Migration Script: Base44 → Supabase
 * 
 * الاستخدام:
 * node migrate-from-base44.js
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// ====================================================
// الإعدادات - Settings
// ====================================================

// Base44 API Settings
const BASE44_API_URL = 'https://app.base44.com/api/apps/6956904186fea0685d192690/entities';
const BASE44_API_KEY = 'bf47b5bef33d46f8b2059e90f236f95d'; // ضع API Key الخاص بـ Base44 هنا

// Supabase Settings (من ملف .env أو مباشرة)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ofdqkracfqakbtjjmksa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHFrcmFjZnFha2J0ampta3NhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA4MzI3MywiZXhwIjoyMDg0NjU5MjczfQ.ykDfnyOhA1ed9SdfWylr_X3R4K7Pz7GKmTtG0d3KtZs'; // مفتاح Service Role (ليس anon key!)

// إنشاء Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ====================================================
// دوال مساعدة
// ====================================================

/**
 * جلب البيانات من Base44
 */
async function fetchFromBase44(endpoint) {
  try {
    console.log(`📥 جلب البيانات من Base44: ${endpoint}`);
    const response = await axios.get(`${BASE44_API_URL}/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${BASE44_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ تم جلب ${response.data?.length || 0} عنصر`);
    return response.data;
  } catch (error) {
    console.error(`❌ خطأ في جلب ${endpoint}:`, error.message);
    return [];
  }
}

/**
 * إدخال البيانات إلى Supabase
 */
async function insertToSupabase(table, data) {
  try {
    if (!data || data.length === 0) {
      console.log(`⚠️ لا توجد بيانات لإدخالها في ${table}`);
      return;
    }

    console.log(`📤 إدخال ${data.length} عنصر إلى ${table}...`);
    
    // تقسيم البيانات إلى دفعات (Supabase يدعم حتى 1000 صف لكل طلب)
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const { error } = await supabase
        .from(table)
        .upsert(batch, { onConflict: 'id' }); // استخدام upsert لتجنب التكرار

      if (error) {
        console.error(`❌ خطأ في إدخال الدفعة ${i / batchSize + 1}:`, error.message);
      } else {
        console.log(`✅ تم إدخال الدفعة ${i / batchSize + 1} (${batch.length} عنصر)`);
      }
    }
  } catch (error) {
    console.error(`❌ خطأ عام في إدخال ${table}:`, error.message);
  }
}

/**
 * تنظيف البيانات وتحويلها للتوافق مع Supabase
 */
function cleanData(data, type) {
  return data.map(item => {
    // إزالة الحقول غير الضرورية
    const cleaned = { ...item };
    
    // حذف الحقول التي قد تسبب مشاكل
    delete cleaned._id;
    delete cleaned.__v;
    delete cleaned.createdBy;
    delete cleaned.updatedBy;
    
    // تحويل التواريخ
    if (item.created_at) cleaned.created_at = new Date(item.created_at).toISOString();
    if (item.updated_at) cleaned.updated_at = new Date(item.updated_at).toISOString();
    
    // معالجة خاصة حسب النوع
    switch(type) {
      case 'menu_items':
        // التأكد من وجود الحقول المطلوبة
        if (!cleaned.price && cleaned.base_price) {
          cleaned.price = cleaned.base_price;
        }
        if (!cleaned.customer_price && cleaned.base_price) {
          cleaned.customer_price = Math.round(cleaned.base_price * 1.1);
        }
        cleaned.is_available = cleaned.available !== false;
        break;
        
      case 'restaurants':
        cleaned.available = cleaned.available !== false;
        break;
        
      case 'products':
        cleaned.is_available = cleaned.available !== false;
        break;
        
      case 'gifts':
        cleaned.is_available = cleaned.available !== false;
        break;
    }
    
    return cleaned;
  });
}

// ====================================================
// دوال النقل الرئيسية
// ====================================================

/**
 * نقل المطاعم
 */
async function migrateRestaurants() {
  console.log('\n🍽️  نقل المطاعم (Restaurants)...');
  const restaurants = await fetchFromBase44('restaurants');
  const cleaned = cleanData(restaurants, 'restaurants');
  await insertToSupabase('restaurants', cleaned);
}

/**
 * نقل أصناف الطعام
 */
async function migrateMenuItems() {
  console.log('\n🍔 نقل أصناف الطعام (Menu Items)...');
  const menuItems = await fetchFromBase44('menu_items');
  const cleaned = cleanData(menuItems, 'menu_items');
  await insertToSupabase('menu_items', cleaned);
}

/**
 * نقل المنتجات
 */
async function migrateProducts() {
  console.log('\n🛒 نقل المنتجات (Products)...');
  const products = await fetchFromBase44('products');
  const cleaned = cleanData(products, 'products');
  await insertToSupabase('products', cleaned);
}

/**
 * نقل الهدايا
 */
async function migrateGifts() {
  console.log('\n🎁 نقل الهدايا (Gifts)...');
  const gifts = await fetchFromBase44('gifts');
  const cleaned = cleanData(gifts, 'gifts');
  await insertToSupabase('gifts', cleaned);
}

/**
 * نقل الباقات
 */
async function migratePackages() {
  console.log('\n📦 نقل الباقات (Packages)...');
  const packages = await fetchFromBase44('packages');
  const cleaned = cleanData(packages, 'packages');
  await insertToSupabase('packages', cleaned);
}

/**
 * نقل الطلبات (اختياري)
 */
async function migrateOrders() {
  console.log('\n📋 نقل الطلبات (Orders)...');
  const orders = await fetchFromBase44('orders');
  const cleaned = cleanData(orders, 'orders');
  await insertToSupabase('orders', cleaned);
}

/**
 * نقل المستخدمين (اختياري)
 */
async function migrateUsers() {
  console.log('\n👥 نقل المستخدمين (Users)...');
  const users = await fetchFromBase44('users');
  const cleaned = cleanData(users, 'users');
  await insertToSupabase('users', cleaned);
}

// ====================================================
// التنفيذ الرئيسي
// ====================================================

async function main() {
  console.log('🚀 بدء نقل البيانات من Base44 إلى Supabase...\n');
  console.log('⏰ الوقت:', new Date().toLocaleString('ar-SA'));
  console.log('🔗 Base44 API:', BASE44_API_URL);
  console.log('🔗 Supabase URL:', SUPABASE_URL);
  console.log('─'.repeat(60));

  try {
    // التحقق من الاتصال بـ Supabase
    const { data, error } = await supabase.from('restaurants').select('count');
    if (error) {
      console.error('❌ خطأ في الاتصال بـ Supabase:', error.message);
      console.log('\n⚠️ تأكد من:');
      console.log('1. إعدادات SUPABASE_URL صحيحة');
      console.log('2. استخدام Service Role Key (ليس anon key)');
      console.log('3. تفعيل RLS policies في Supabase');
      return;
    }
    console.log('✅ الاتصال بـ Supabase ناجح\n');

    // نقل البيانات بالترتيب
    await migrateRestaurants();    // 1. المطاعم أولاً
    await migrateMenuItems();      // 2. الأصناف (تعتمد على المطاعم)
    await migrateProducts();       // 3. المنتجات
    await migrateGifts();          // 4. الهدايا
    await migratePackages();       // 5. الباقات
    // await migrateUsers();       // 6. المستخدمين (اختياري)
    // await migrateOrders();      // 7. الطلبات (اختياري)

    console.log('\n' + '─'.repeat(60));
    console.log('✅ تم الانتهاء من نقل جميع البيانات!');
    console.log('⏰ الوقت:', new Date().toLocaleString('ar-SA'));
    
  } catch (error) {
    console.error('\n❌ حدث خطأ أثناء النقل:', error);
  }
}

// تنفيذ السكربت
main().catch(console.error);
