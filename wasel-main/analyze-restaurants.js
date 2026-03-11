/**
 * تحليل علاقة المطاعم بالأصناف
 */

const BASE44_APP_ID = '6956904186fea0685d192690';
const BASE44_API_KEY = 'bf47b5bef33d46f8b2059e90f236f95d';

async function analyzeData() {
  console.log('🔍 تحليل علاقة المطاعم بالأصناف...\n');
  
  try {
    // جلب المطاعم
    const restaurantsRes = await fetch(
      `https://app.base44.com/api/apps/${BASE44_APP_ID}/entities/Restaurant`,
      { headers: { 'api_key': BASE44_API_KEY } }
    );
    const restaurantsData = await restaurantsRes.json();
    const restaurants = restaurantsData.data || restaurantsData;

    // جلب الأصناف
    const menuRes = await fetch(
      `https://app.base44.com/api/apps/${BASE44_APP_ID}/entities/MenuItem`,
      { headers: { 'api_key': BASE44_API_KEY } }
    );
    const menuData = await menuRes.json();
    const menuItems = menuData.data || menuData;

    console.log(`📊 الإحصائيات:`);
    console.log(`   المطاعم: ${restaurants.length}`);
    console.log(`   الأصناف: ${menuItems.length}\n`);
    console.log('='.repeat(80));

    // تحليل كل مطعم
    restaurants.forEach((restaurant, index) => {
      const restId = restaurant.id || restaurant._id;
      const relatedItems = menuItems.filter(item => 
        item.restaurant_id === restId || item.restaurant === restId
      );

      console.log(`\n${index + 1}. 🍽️  ${restaurant.name || restaurant.name_ar}`);
      console.log(`   ID: ${restId}`);
      console.log(`   الموقع: ${restaurant.location || 'غير محدد'}`);
      console.log(`   الأصناف: ${relatedItems.length}`);
      
      if (relatedItems.length > 0) {
        console.log(`   ✅ الأصناف المتوفرة:`);
        relatedItems.slice(0, 5).forEach(item => {
          console.log(`      - ${item.name || item.name_ar} (${item.base_price || 0} ل.س)`);
        });
        if (relatedItems.length > 5) {
          console.log(`      ... و ${relatedItems.length - 5} صنف آخر`);
        }
      } else {
        console.log(`   ⚠️  لا توجد أصناف!`);
      }
    });

    // البحث عن أصناف بدون مطعم
    const orphans = menuItems.filter(item => {
      const itemRestId = item.restaurant_id || item.restaurant;
      return !restaurants.some(r => (r.id || r._id) === itemRestId);
    });

    if (orphans.length > 0) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`\n⚠️  أصناف بدون مطعم موجود (${orphans.length}):\n`);
      
      // تجميع حسب restaurant_id
      const groupedOrphans = {};
      orphans.forEach(item => {
        const restId = item.restaurant_id || item.restaurant || 'unknown';
        if (!groupedOrphans[restId]) {
          groupedOrphans[restId] = [];
        }
        groupedOrphans[restId].push(item);
      });

      Object.entries(groupedOrphans).forEach(([restId, items]) => {
        console.log(`   Restaurant ID: ${restId} (${items.length} صنف)`);
        items.slice(0, 3).forEach(item => {
          console.log(`      - ${item.name || item.name_ar}`);
        });
        if (items.length > 3) {
          console.log(`      ... و ${items.length - 3} صنف آخر`);
        }
      });

      console.log(`\n💡 الحل المقترح:`);
      console.log(`   1. ابحث عن المطعم بهذا الـ ID: ${Object.keys(groupedOrphans)[0]}`);
      console.log(`   2. أو قم بتحديث restaurant_id في الأصناف إلى الـ ID الصحيح`);
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

analyzeData();
