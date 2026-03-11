/**
 * Debug Base44 Restaurant Data Structure
 */

const BASE44_APP_ID = '6956904186fea0685d192690';
const BASE44_API_KEY = 'bf47b5bef33d46f8b2059e90f236f95d';

async function debugRestaurant() {
  console.log('🔍 Debugging Restaurant Data Structure...\n');
  
  try {
    // 1. Fetch all restaurants
    console.log('📡 Fetching all restaurants...');
    const restaurantsResponse = await fetch(
      `https://app.base44.com/api/apps/${BASE44_APP_ID}/entities/Restaurant`,
      {
        headers: {
          'api_key': BASE44_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const restaurantsData = await restaurantsResponse.json();
    const restaurants = restaurantsData.data || restaurantsData;
    
    console.log(`✅ Found ${restaurants.length} restaurants`);
    console.log('\n📋 Restaurant Structure:');
    if (restaurants[0]) {
      console.log(JSON.stringify(restaurants[0], null, 2));
      console.log('\n🔑 Restaurant ID:', restaurants[0]._id || restaurants[0].id);
    }
    
    // 2. Fetch all menu items
    console.log('\n\n📡 Fetching all menu items...');
    const menuResponse = await fetch(
      `https://app.base44.com/api/apps/${BASE44_APP_ID}/entities/MenuItem`,
      {
        headers: {
          'api_key': BASE44_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const menuData = await menuResponse.json();
    const menuItems = menuData.data || menuData;
    
    console.log(`✅ Found ${menuItems.length} menu items`);
    console.log('\n📋 Menu Item Structure:');
    if (menuItems[0]) {
      console.log(JSON.stringify(menuItems[0], null, 2));
      console.log('\n🔗 restaurant_id field:', menuItems[0].restaurant_id || menuItems[0].restaurant);
    }
    
    // 3. Check relationship
    console.log('\n\n🔗 Checking Relationships...');
    if (restaurants[0]) {
      const restaurantId = restaurants[0]._id || restaurants[0].id;
      const relatedItems = menuItems.filter(item => {
        const itemRestId = item.restaurant_id || item.restaurant;
        console.log(`  MenuItem: ${item.name || item.name_ar} - restaurant_id: ${itemRestId} - Match: ${itemRestId === restaurantId}`);
        return itemRestId === restaurantId;
      });
      console.log(`\n✅ Found ${relatedItems.length} items for restaurant: ${restaurants[0].name || restaurants[0].name_ar}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugRestaurant();
