/**
 * سكربت رفع البيانات من ملفات JSON إلى Supabase
 * Upload JSON files to Supabase
 * 
 * الاستخدام:
 * 1. ضع ملفات JSON في مجلد data/
 * 2. node upload-json-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ====================================================
// الإعدادات
// ====================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ofdqkracfqakbtjjmksa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; // ضع Service Role Key هنا

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// المجلد الذي يحتوي على ملفات JSON
const DATA_DIR = './data';

// ====================================================
// دوال مساعدة
// ====================================================

/**
 * قراءة ملف JSON
 */
function readJSONFile(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    console.log(`📖 قراءة ملف: ${filename}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ الملف غير موجود: ${filename}`);
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    console.log(`✅ تم قراءة ${Array.isArray(data) ? data.length : 1} عنصر من ${filename}`);
    return data;
  } catch (error) {
    console.error(`❌ خطأ في قراءة ${filename}:`, error.message);
    return null;
  }
}

/**
 * تنظيف وتحويل البيانات
 */
function cleanData(data, type) {
  if (!Array.isArray(data)) {
    data = [data];
  }

  return data.map(item => {
    const cleaned = { ...item };
    
    // حذف الحقول غير الضرورية
    delete cleaned._id;
    delete cleaned.__v;
    delete cleaned.createdBy;
    delete cleaned.updatedBy;
    
    // تحويل التواريخ
    if (item.created_at) {
      cleaned.created_at = new Date(item.created_at).toISOString();
    }
    if (item.updated_at) {
      cleaned.updated_at = new Date(item.updated_at).toISOString();
    }
    
    // معالجة خاصة
    switch(type) {
      case 'menu_items':
        if (!cleaned.price && cleaned.base_price) {
          cleaned.price = cleaned.base_price;
        }
        if (!cleaned.customer_price && cleaned.base_price) {
          cleaned.customer_price = Math.round(cleaned.base_price * 1.1);
        }
        cleaned.is_available = cleaned.available !== false;
        break;
        
      case 'restaurants':
      case 'products':
      case 'gifts':
      case 'packages':
        cleaned.available = cleaned.available !== false;
        if (type !== 'restaurants') {
          cleaned.is_available = cleaned.available;
        }
        break;
    }
    
    return cleaned;
  });
}

/**
 * رفع البيانات إلى Supabase
 */
async function uploadToSupabase(table, data) {
  if (!data || data.length === 0) {
    console.log(`⚠️ لا توجد بيانات لرفعها إلى ${table}`);
    return;
  }

  console.log(`📤 رفع ${data.length} عنصر إلى ${table}...`);
  
  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    const { data: inserted, error } = await supabase
      .from(table)
      .upsert(batch, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error(`❌ خطأ في الدفعة ${Math.floor(i / batchSize) + 1}:`, error.message);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
      console.log(`✅ تم رفع الدفعة ${Math.floor(i / batchSize) + 1} (${batch.length} عنصر)`);
    }
  }

  console.log(`📊 النتيجة: ${successCount} نجح، ${errorCount} فشل\n`);
}

// ====================================================
// دوال الرفع
// ====================================================

async function uploadRestaurants() {
  console.log('\n🍽️  رفع المطاعم...');
  const data = readJSONFile('restaurants.json');
  if (data) {
    const cleaned = cleanData(data, 'restaurants');
    await uploadToSupabase('restaurants', cleaned);
  }
}

async function uploadMenuItems() {
  console.log('\n🍔 رفع أصناف الطعام...');
  const data = readJSONFile('menu_items.json');
  if (data) {
    const cleaned = cleanData(data, 'menu_items');
    await uploadToSupabase('menu_items', cleaned);
  }
}

async function uploadProducts() {
  console.log('\n🛒 رفع المنتجات...');
  const data = readJSONFile('products.json');
  if (data) {
    const cleaned = cleanData(data, 'products');
    await uploadToSupabase('products', cleaned);
  }
}

async function uploadGifts() {
  console.log('\n🎁 رفع الهدايا...');
  const data = readJSONFile('gifts.json');
  if (data) {
    const cleaned = cleanData(data, 'gifts');
    await uploadToSupabase('gifts', cleaned);
  }
}

async function uploadPackages() {
  console.log('\n📦 رفع الباقات...');
  const data = readJSONFile('packages.json');
  if (data) {
    const cleaned = cleanData(data, 'packages');
    await uploadToSupabase('packages', cleaned);
  }
}

// ====================================================
// التنفيذ الرئيسي
// ====================================================

async function main() {
  console.log('🚀 بدء رفع البيانات من ملفات JSON إلى Supabase...\n');
  console.log('📁 مجلد البيانات:', DATA_DIR);
  console.log('🔗 Supabase URL:', SUPABASE_URL);
  console.log('─'.repeat(60));

  // التحقق من وجود المجلد
  if (!fs.existsSync(DATA_DIR)) {
    console.log(`⚠️ مجلد البيانات غير موجود. إنشاء المجلد: ${DATA_DIR}`);
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('\n📝 ضع ملفات JSON في المجلد التالي:');
    console.log(`   - ${DATA_DIR}/restaurants.json`);
    console.log(`   - ${DATA_DIR}/menu_items.json`);
    console.log(`   - ${DATA_DIR}/products.json`);
    console.log(`   - ${DATA_DIR}/gifts.json`);
    console.log(`   - ${DATA_DIR}/packages.json`);
    console.log('\nثم شغّل السكربت مرة أخرى.');
    return;
  }

  // عرض الملفات المتاحة
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  console.log(`\n📂 الملفات المتاحة: ${files.join(', ')}\n`);

  if (files.length === 0) {
    console.log('⚠️ لا توجد ملفات JSON في المجلد!');
    return;
  }

  try {
    // التحقق من الاتصال
    const { error } = await supabase.from('restaurants').select('count').limit(1);
    if (error) {
      console.error('❌ خطأ في الاتصال بـ Supabase:', error.message);
      return;
    }
    console.log('✅ الاتصال بـ Supabase ناجح\n');

    // رفع البيانات
    await uploadRestaurants();
    await uploadMenuItems();
    await uploadProducts();
    await uploadGifts();
    await uploadPackages();

    console.log('\n' + '─'.repeat(60));
    console.log('✅ تم الانتهاء من رفع جميع البيانات!');
    console.log('⏰ الوقت:', new Date().toLocaleString('ar-SA'));

  } catch (error) {
    console.error('\n❌ حدث خطأ:', error);
  }
}

// تنفيذ
main().catch(console.error);
