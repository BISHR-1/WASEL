/**
 * Base44 Client - Real Base44 API Integration
 * التكامل الحقيقي مع Base44 API
 */

import { supabase } from '@/lib/supabase';

// ====================================================
// Base44 Configuration
// ====================================================

const BASE44_APP_ID = '6956904186fea0685d192690';
const BASE44_API_KEY = 'bf47b5bef33d46f8b2059e90f236f95d';
const BASE44_BASE_URL = `https://app.base44.com/api/apps/${BASE44_APP_ID}/entities`;

// ====================================================
// Helper Functions
// ====================================================

/**
 * Make API request to Base44
 */
async function base44Request(endpoint, options = {}) {
  const url = `${BASE44_BASE_URL}/${endpoint}`;
  const headers = {
    'api_key': BASE44_API_KEY,
    'Content-Type': 'application/json',
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  console.log('[Base44] Request:', url);
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    console.error('[Base44] Error:', response.status, error);
    throw new Error(error.message || 'Base44 API Error');
  }

  const data = await response.json();
  console.log('[Base44] Response:', endpoint, data);
  return data;
}

// ====================================================
// Base44 Object
// ====================================================

export const base44 = {
  // Auth Methods (use Supabase for auth)
  auth: {
    async signInWithGoogle() {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      return data;
    },
    
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    
    async getSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
    
    async getUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
    
    onAuthStateChange(callback) {
      return supabase.auth.onAuthStateChange(callback);
    }
  },

  // Entity Methods (use Base44 API)
  entities: {
    Restaurant: {
      async list(filters = {}) {
        const data = await base44Request('Restaurant');
        return data.data || data;
      },
      async get(id) {
        const data = await base44Request(`Restaurant/${id}`);
        return data;
      },
      async create(restaurantData) {
        const data = await base44Request('Restaurant', {
          method: 'POST',
          body: JSON.stringify(restaurantData)
        });
        return data;
      },
      async update(id, restaurantData) {
        const data = await base44Request(`Restaurant/${id}`, {
          method: 'PUT',
          body: JSON.stringify(restaurantData)
        });
        return data;
      },
      async delete(id) {
        await base44Request(`Restaurant/${id}`, { method: 'DELETE' });
      }
    },
    MenuItem: {
      async list(filters = {}) {
        const data = await base44Request('MenuItem');
        return data.data || data;
      },
      async get(id) {
        const data = await base44Request(`MenuItem/${id}`);
        return data;
      },
      async create(menuItemData) {
        const data = await base44Request('MenuItem', {
          method: 'POST',
          body: JSON.stringify(menuItemData)
        });
        return data;
      },
      async update(id, menuItemData) {
        const data = await base44Request(`MenuItem/${id}`, {
          method: 'PUT',
          body: JSON.stringify(menuItemData)
        });
        return data;
      },
      async delete(id) {
        await base44Request(`MenuItem/${id}`, { method: 'DELETE' });
      }
    },
    Product: {
      async list(filters = {}) {
        const data = await base44Request('Product');
        return data.data || data;
      },
      async get(id) {
        const data = await base44Request(`Product/${id}`);
        return data;
      },
      async create(productData) {
        const data = await base44Request('Product', {
          method: 'POST',
          body: JSON.stringify(productData)
        });
        return data;
      },
      async update(id, productData) {
        const data = await base44Request(`Product/${id}`, {
          method: 'PUT',
          body: JSON.stringify(productData)
        });
        return data;
      },
      async delete(id) {
        await base44Request(`Product/${id}`, { method: 'DELETE' });
      }
    },
    Gift: {
      async list(filters = {}) {
        const data = await base44Request('Gift');
        return data.data || data;
      },
      async get(id) {
        const data = await base44Request(`Gift/${id}`);
        return data;
      },
      async create(giftData) {
        const data = await base44Request('Gift', {
          method: 'POST',
          body: JSON.stringify(giftData)
        });
        return data;
      },
      async update(id, giftData) {
        const data = await base44Request(`Gift/${id}`, {
          method: 'PUT',
          body: JSON.stringify(giftData)
        });
        return data;
      },
      async delete(id) {
        await base44Request(`Gift/${id}`, { method: 'DELETE' });
      }
    },
    Package: {
      async list(filters = {}) {
        const data = await base44Request('Package');
        return data.data || data;
      },
      async get(id) {
        const data = await base44Request(`Package/${id}`);
        return data;
      },
      async create(packageData) {
        const data = await base44Request('Package', {
          method: 'POST',
          body: JSON.stringify(packageData)
        });
        return data;
      },
      async update(id, packageData) {
        const data = await base44Request(`Package/${id}`, {
          method: 'PUT',
          body: JSON.stringify(packageData)
        });
        return data;
      },
      async delete(id) {
        await base44Request(`Package/${id}`, { method: 'DELETE' });
      }
    },
    Order: {
      async list(filters = {}) {
        const data = await base44Request('Order');
        return data.data || data;
      },
      async get(id) {
        const data = await base44Request(`Order/${id}`);
        return data;
      },
      async create(orderData) {
        const data = await base44Request('Order', {
          method: 'POST',
          body: JSON.stringify(orderData)
        });
        return data;
      },
      async update(id, orderData) {
        const data = await base44Request(`Order/${id}`, {
          method: 'PUT',
          body: JSON.stringify(orderData)
        });
        return data;
      },
      async delete(id) {
        await base44Request(`Order/${id}`, { method: 'DELETE' });
      }
    },
    Story: {
      async list(filters = {}) {
        const data = await base44Request('Story');
        return data.data || data;
      },
      async create(storyData) {
        const data = await base44Request('Story', {
          method: 'POST',
          body: JSON.stringify(storyData)
        });
        return data;
      },
      async delete(id) {
        await base44Request(`Story/${id}`, { method: 'DELETE' });
      }
    },
    Review: {
      async list(filters = {}) {
        const data = await base44Request('Review');
        return data.data || data;
      },
      async get(id) {
        const data = await base44Request(`Review/${id}`);
        return data;
      },
      async create(reviewData) {
        const data = await base44Request('Review', {
          method: 'POST',
          body: JSON.stringify(reviewData)
        });
        return data;
      },
      async update(id, reviewData) {
        const data = await base44Request(`Review/${id}`, {
          method: 'PUT',
          body: JSON.stringify(reviewData)
        });
        return data;
      },
      async delete(id) {
        await base44Request(`Review/${id}`, { method: 'DELETE' });
      }
    }
  },

  // Storage/Upload Methods (use Base44 file upload)
  storage: {
    async upload(file, bucket = 'public') {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${BASE44_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'api_key': BASE44_API_KEY
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      return data.url || data.path;
    }
  },

  // Functions (Cloud Functions compatibility)
  functions: {
    async invoke(functionName, params = {}) {
      console.log(`Function ${functionName} called with params:`, params);
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: params
      });
      if (error) throw error;
      return data;
    }
  }
};

// Default export
export default base44;
