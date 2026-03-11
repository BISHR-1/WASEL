/**
 * Test Base44 API Connection
 */

const BASE44_APP_ID = '6956904186fea0685d192690';
const BASE44_API_KEY = 'bf47b5bef33d46f8b2059e90f236f95d';

async function testBase44() {
  console.log('🧪 Testing Base44 API Connection...\n');
  
  const entities = ['Restaurant', 'MenuItem', 'Product', 'Gift', 'Package', 'Order'];
  
  for (const entity of entities) {
    try {
      const url = `https://app.base44.com/api/apps/${BASE44_APP_ID}/entities/${entity}`;
      console.log(`📡 Fetching ${entity}...`);
      
      const response = await fetch(url, {
        headers: {
          'api_key': BASE44_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const items = data.data || data;
        console.log(`✅ ${entity}: ${Array.isArray(items) ? items.length : 0} items`);
      } else {
        const error = await response.text();
        console.log(`❌ ${entity}: ${response.status} - ${error}`);
      }
    } catch (error) {
      console.log(`❌ ${entity}: ${error.message}`);
    }
    console.log('');
  }
}

testBase44();
