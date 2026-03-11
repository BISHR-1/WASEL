/**
 * Wasel App - Supabase Client
 * استبدال كامل لـ Base44 بـ Supabase
 */

import { supabase } from '@/lib/supabase';

// ====================================================
// Helper Functions
// ====================================================

const handleSupabaseError = (error, operation) => {
  console.error(`Supabase ${operation} error:`, error);
  throw new Error(error.message || `Failed to ${operation}`);
};

// ====================================================
// Restaurants API
// ====================================================

export const fetchRestaurants = async (params = {}) => {
  try {
    let query = supabase
      .from('restaurants')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (params.category) {
      query = query.eq('category', params.category);
    }

    if (params.is_featured) {
      query = query.eq('is_featured', true);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) handleSupabaseError(error, 'fetch restaurants');
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch restaurants');
  }
};

export const fetchRestaurantById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) handleSupabaseError(error, 'fetch restaurant');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'fetch restaurant');
  }
};

export const createRestaurant = async (restaurantData) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .insert([restaurantData])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'create restaurant');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'create restaurant');
  }
};

export const updateRestaurant = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update restaurant');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'update restaurant');
  }
};

export const deleteRestaurant = async (id) => {
  try {
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error, 'delete restaurant');
    return true;
  } catch (error) {
    handleSupabaseError(error, 'delete restaurant');
  }
};

// ====================================================
// Menu Items API
// ====================================================

export const fetchMenuItems = async (params = {}) => {
  try {
    let query = supabase
      .from('menu_items')
      .select('*, restaurants(*)')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (params.restaurant_id) {
      query = query.eq('restaurant_id', params.restaurant_id);
    }

    if (params.category) {
      query = query.eq('category', params.category);
    }

    if (params.is_featured) {
      query = query.eq('is_featured', true);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) handleSupabaseError(error, 'fetch menu items');
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch menu items');
  }
};

export const fetchMenuItemById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, restaurants(*)')
      .eq('id', id)
      .single();

    if (error) handleSupabaseError(error, 'fetch menu item');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'fetch menu item');
  }
};

// ====================================================
// Products API
// ====================================================

export const fetchProducts = async (params = {}) => {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (params.category) {
      query = query.eq('category', params.category);
    }

    if (params.is_featured) {
      query = query.eq('is_featured', true);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) handleSupabaseError(error, 'fetch products');
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch products');
  }
};

export const fetchProductById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) handleSupabaseError(error, 'fetch product');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'fetch product');
  }
};

export const createProduct = async (productData) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'create product');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'create product');
  }
};

export const updateProduct = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update product');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'update product');
  }
};

export const deleteProduct = async (id) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error, 'delete product');
    return true;
  } catch (error) {
    handleSupabaseError(error, 'delete product');
  }
};

// ====================================================
// Gifts API
// ====================================================

export const fetchGifts = async (params = {}) => {
  try {
    let query = supabase
      .from('gifts')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (params.category) {
      query = query.eq('category', params.category);
    }

    if (params.occasion) {
      query = query.eq('occasion', params.occasion);
    }

    if (params.is_featured) {
      query = query.eq('is_featured', true);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) handleSupabaseError(error, 'fetch gifts');
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch gifts');
  }
};

export const fetchGiftById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) handleSupabaseError(error, 'fetch gift');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'fetch gift');
  }
};

export const createGift = async (giftData) => {
  try {
    const { data, error } = await supabase
      .from('gifts')
      .insert([giftData])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'create gift');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'create gift');
  }
};

export const updateGift = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('gifts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update gift');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'update gift');
  }
};

export const deleteGift = async (id) => {
  try {
    const { error } = await supabase
      .from('gifts')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error, 'delete gift');
    return true;
  } catch (error) {
    handleSupabaseError(error, 'delete gift');
  }
};

// ====================================================
// Packages API
// ====================================================

export const fetchPackages = async (params = {}) => {
  try {
    let query = supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (params.is_popular) {
      query = query.eq('is_popular', true);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) handleSupabaseError(error, 'fetch packages');
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch packages');
  }
};

export const createPackage = async (packageData) => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .insert([packageData])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'create package');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'create package');
  }
};

export const updatePackage = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update package');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'update package');
  }
};

export const deletePackage = async (id) => {
  try {
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error, 'delete package');
    return true;
  } catch (error) {
    handleSupabaseError(error, 'delete package');
  }
};

// ====================================================
// Cart API
// ====================================================

export const fetchCart = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', userId);

    if (error) handleSupabaseError(error, 'fetch cart');
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch cart');
  }
};

export const addToCart = async (userId, itemData) => {
  try {
    const { data, error } = await supabase
      .from('cart')
      .upsert({
        user_id: userId,
        item_type: itemData.item_type,
        item_id: itemData.item_id,
        quantity: itemData.quantity || 1,
        options: itemData.options || {}
      }, {
        onConflict: 'user_id,item_type,item_id'
      })
      .select()
      .single();

    if (error) handleSupabaseError(error, 'add to cart');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'add to cart');
  }
};

export const updateCartItem = async (cartId, quantity) => {
  try {
    const { data, error } = await supabase
      .from('cart')
      .update({ quantity })
      .eq('id', cartId)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update cart');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'update cart');
  }
};

export const removeFromCart = async (cartId) => {
  try {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', cartId);

    if (error) handleSupabaseError(error, 'remove from cart');
  } catch (error) {
    handleSupabaseError(error, 'remove from cart');
  }
};

export const clearCart = async (userId) => {
  try {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId);

    if (error) handleSupabaseError(error, 'clear cart');
  } catch (error) {
    handleSupabaseError(error, 'clear cart');
  }
};

// ====================================================
// Orders API
// ====================================================

export const createOrder = async (orderData) => {
  try {
    // Generate order number
    const { data: orderNumber } = await supabase.rpc('generate_order_number');

    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...orderData,
        order_number: orderNumber || `ORD-${Date.now()}`
      })
      .select()
      .single();

    if (error) handleSupabaseError(error, 'create order');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'create order');
  }
};

export const createOrderItems = async (orderItems) => {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (error) handleSupabaseError(error, 'create order items');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'create order items');
  }
};

export const fetchOrders = async (userId, params = {}) => {
  try {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) handleSupabaseError(error, 'fetch orders');
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch orders');
  }
};

export const fetchOrderById = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (error) handleSupabaseError(error, 'fetch order');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'fetch order');
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update order status');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'update order status');
  }
};

export const updateOrder = async (orderId, updates) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update order');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'update order');
  }
};

// ====================================================
// Favorites API
// ====================================================

export const fetchFavorites = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId);

    if (error) handleSupabaseError(error, 'fetch favorites');
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch favorites');
  }
};

export const addToFavorites = async (userId, itemType, itemId) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        item_type: itemType,
        item_id: itemId
      })
      .select()
      .single();

    if (error) handleSupabaseError(error, 'add to favorites');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'add to favorites');
  }
};

export const removeFromFavorites = async (favoriteId) => {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId);

    if (error) handleSupabaseError(error, 'remove from favorites');
  } catch (error) {
    handleSupabaseError(error, 'remove from favorites');
  }
};

// ====================================================
// User API
// ====================================================

export const getCurrentUser = async () => {
  try {
    // First, get the session from Supabase auth
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // If there's an error fetching the session, log it and return null
    if (sessionError) {
      const isAbort = String(sessionError?.name || '').includes('AbortError')
        || String(sessionError?.message || '').includes('AbortError')
        || String(sessionError?.details || '').includes('signal is aborted');
      if (!isAbort) {
        console.error('Supabase get session error:', sessionError);
      }
      return null;
    }

    // If there is no session, the user is not logged in. Return null.
    if (!session) {
      return null;
    }

    // If a session exists, get the corresponding user profile from the 'users' table
    const { data: userProfile, error: userProfileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', session.user.id)
      .maybeSingle();

    // If there's an error fetching the profile (and it's not the 'no rows' error),
    // log it and return null.
    if (userProfileError && userProfileError.code !== 'PGRST116') {
      const isAbort = String(userProfileError?.name || '').includes('AbortError')
        || String(userProfileError?.message || '').includes('AbortError')
        || String(userProfileError?.details || '').includes('signal is aborted');
      if (!isAbort) {
        console.error('Supabase get user profile error:', userProfileError);
      }
      return session.user;
    }

    // Combine the auth user data with the profile data
    // If a profile exists, merge them; otherwise, just return the auth user data.
    return userProfile ? { ...session.user, ...userProfile } : session.user;

  } catch (error) {
    // Catch any other unexpected errors
    const isAbort = String(error?.name || '').includes('AbortError')
      || String(error?.message || '').includes('AbortError')
      || String(error?.details || '').includes('signal is aborted');
    if (!isAbort) {
      console.error('Unexpected error in getCurrentUser:', error);
    }
    return null;
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update user profile');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'update user profile');
  }
};

// ====================================================
// Addresses API
// ====================================================

export const fetchAddresses = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) handleSupabaseError(error, 'fetch addresses');
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch addresses');
  }
};

export const createAddress = async (addressData) => {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .insert(addressData)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'create address');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'create address');
  }
};

export const updateAddress = async (addressId, updates) => {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .update(updates)
      .eq('id', addressId)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update address');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'update address');
  }
};

export const deleteAddress = async (addressId) => {
  try {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId);

    if (error) handleSupabaseError(error, 'delete address');
  } catch (error) {
    handleSupabaseError(error, 'delete address');
  }
};

// ====================================================
// Stories API (القصص)
// ====================================================

export const fetchStories = async (params = {}) => {
  try {
    let query = supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.is_active !== undefined) {
      query = query.eq('is_active', params.is_active);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) handleSupabaseError(error, 'fetch stories');
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch stories');
  }
};

export const createStory = async (storyData) => {
  try {
    const { data, error } = await supabase
      .from('stories')
      .insert([storyData])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'create story');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'create story');
  }
};

export const updateStory = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update story');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'update story');
  }
};

export const deleteStory = async (id) => {
  try {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error, 'delete story');
  } catch (error) {
    handleSupabaseError(error, 'delete story');
  }
};

// ====================================================
// Menu Items CRUD (إضافة الدوال المفقودة)
// ====================================================

export const createMenuItem = async (itemData) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([itemData])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'create menu item');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'create menu item');
  }
};

export const updateMenuItem = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update menu item');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'update menu item');
  }
};

export const deleteMenuItem = async (id) => {
  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error, 'delete menu item');
    return true;
  } catch (error) {
    handleSupabaseError(error, 'delete menu item');
  }
};

// ====================================================
// Users API (المستخدمين)
// ====================================================

export const fetchUsers = async (params = {}) => {
  try {
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.role) {
      query = query.eq('role', params.role);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) handleSupabaseError(error, 'fetch users');
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch users');
  }
};

export const fetchUserById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) handleSupabaseError(error, 'fetch user');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'fetch user');
  }
};

export const createUser = async (userData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'create user');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'create user');
  }
};

export const updateUser = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update user');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'update user');
  }
};

export const deleteUser = async (id) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error, 'delete user');
    return true;
  } catch (error) {
    handleSupabaseError(error, 'delete user');
  }
};

// ====================================================
// Reviews API (التقييمات)
// ====================================================

export const fetchReviews = async (params = {}) => {
  try {
    let query = supabase
      .from('reviews')
      .select('*, users(*)')
      .order('created_at', { ascending: false });

    if (params.restaurant_id) {
      query = query.eq('restaurant_id', params.restaurant_id);
    }

    if (params.order_id) {
      query = query.eq('order_id', params.order_id);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) handleSupabaseError(error, 'fetch reviews');
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch reviews');
  }
};

export const fetchReviewById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users(*)')
      .eq('id', id)
      .single();

    if (error) handleSupabaseError(error, 'fetch review');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'fetch review');
  }
};

export const createReview = async (reviewData) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'create review');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'create review');
  }
};

export const updateReview = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update review');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'update review');
  }
};

export const deleteReview = async (id) => {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error, 'delete review');
    return true;
  } catch (error) {
    handleSupabaseError(error, 'delete review');
  }
};

// ====================================================
// Notifications API (الإشعارات)
// ====================================================

export const fetchNotifications = async (params = {}) => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.user_id) {
      query = query.eq('user_id', params.user_id);
    }

    if (params.is_read !== undefined) {
      query = query.eq('is_read', params.is_read);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) handleSupabaseError(error, 'fetch notifications');
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch notifications');
  }
};

export const fetchNotificationById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) handleSupabaseError(error, 'fetch notification');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'fetch notification');
  }
};

export const createNotification = async (notificationData) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'create notification');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'create notification');
  }
};

export const updateNotification = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update notification');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'update notification');
  }
};

export const deleteNotification = async (id) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error, 'delete notification');
    return true;
  } catch (error) {
    handleSupabaseError(error, 'delete notification');
  }
};

// ====================================================
// Cart API (السلة)
// ====================================================

export const fetchCartItems = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error, 'fetch cart items');
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch cart items');
  }
};

// ====================================================
// Orders - Delete Function
// ====================================================

export const deleteOrder = async (id) => {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error, 'delete order');
    return true;
  } catch (error) {
    handleSupabaseError(error, 'delete order');
  }
};

// ====================================================
// Packages - Fetch By ID
// ====================================================

export const fetchPackageById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) handleSupabaseError(error, 'fetch package');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'fetch package');
  }
};

// ====================================================
// Addresses - Fetch By ID
// ====================================================

export const fetchAddressById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) handleSupabaseError(error, 'fetch address');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'fetch address');
  }
};

// ====================================================
// Unified Fetch Function (استبدال fetchBase44Entities)
// ====================================================

export const fetchEntities = async (entityType, params = {}) => {
  const entityMap = {
    'Restaurant': fetchRestaurants,
    'MenuItem': fetchMenuItems,
    'RestaurantItem': fetchMenuItems,
    'Product': fetchProducts,
    'Gift': fetchGifts,
    'Package': fetchPackages
  };

  const fetchFunction = entityMap[entityType];
  
  if (!fetchFunction) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  return fetchFunction(params);
};

// Backward compatibility wrapper (للتوافق مع الكود القديم)
export const fetchBase44Entities = fetchEntities;

// ====================================================
// File Upload API
// ====================================================

export const uploadFile = async (file, bucket = 'public') => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${bucket}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) handleSupabaseError(error, 'upload file');

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    handleSupabaseError(error, 'upload file');
  }
};
