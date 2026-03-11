/**
 * Sender/Receiver Information Manager
 * مدير معلومات المرسل والمستلم - حفظ واسترجاع البيانات
 */

const SENDER_STORAGE_KEY = 'wasel_sender_info';
const RECEIVER_STORAGE_KEY = 'wasel_receiver_info';
const ADDRESS_BOOK_STORAGE_KEY = 'wasel_addresses';
const SELECTED_ADDRESS_KEY = 'wasel_selected_address';

function getActiveIdentityScope() {
  try {
    const scope = localStorage.getItem('wasel_active_identity');
    return scope ? String(scope) : 'guest';
  } catch {
    return 'guest';
  }
}

function scopedKey(baseKey) {
  return `${baseKey}:${getActiveIdentityScope()}`;
}

// ============================================================
// Sender Information
// ============================================================

/**
 * Save sender information
 */
export function saveSenderInfo(data) {
  try {
    localStorage.setItem(scopedKey(SENDER_STORAGE_KEY), JSON.stringify({
      ...data,
      savedAt: Date.now()
    }));
    return true;
  } catch (error) {
    console.error('❌ خطأ في حفظ معلومات المرسل:', error);
    return false;
  }
}

/**
 * Get saved sender information
 */
export function getSavedSenderInfo() {
  try {
    const data = localStorage.getItem(scopedKey(SENDER_STORAGE_KEY));
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ خطأ في قراءة معلومات المرسل:', error);
    return null;
  }
}

/**
 * Clear sender information
 */
export function clearSenderInfo() {
  try {
    localStorage.removeItem(scopedKey(SENDER_STORAGE_KEY));
    return true;
  } catch (error) {
    console.error('❌ خطأ في حذف معلومات المرسل:', error);
    return false;
  }
}

// ============================================================
// Receiver Information
// ============================================================

/**
 * Save receiver information
 */
export function saveReceiverInfo(data) {
  try {
    localStorage.setItem(scopedKey(RECEIVER_STORAGE_KEY), JSON.stringify({
      ...data,
      savedAt: Date.now()
    }));
    return true;
  } catch (error) {
    console.error('❌ خطأ في حفظ معلومات المستلم:', error);
    return false;
  }
}

/**
 * Get saved receiver information
 */
export function getSavedReceiverInfo() {
  try {
    const data = localStorage.getItem(scopedKey(RECEIVER_STORAGE_KEY));
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ خطأ في قراءة معلومات المستلم:', error);
    return null;
  }
}

/**
 * Clear receiver information
 */
export function clearReceiverInfo() {
  try {
    localStorage.removeItem(scopedKey(RECEIVER_STORAGE_KEY));
    return true;
  } catch (error) {
    console.error('❌ خطأ في حذف معلومات المستلم:', error);
    return false;
  }
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Clear all saved information
 */
export function clearAllSavedInfo() {
  clearSenderInfo();
  clearReceiverInfo();
  return true;
}

/**
 * Get all saved information
 */
export function getAllSavedInfo() {
  return {
    sender: getSavedSenderInfo(),
    receiver: getSavedReceiverInfo()
  };
}

// ============================================================
// Address Book (Profile + Cart)
// ============================================================

export function getSavedAddresses() {
  try {
    const raw = localStorage.getItem(scopedKey(ADDRESS_BOOK_STORAGE_KEY));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error('❌ خطأ في قراءة دفتر العناوين:', error);
    return [];
  }
}

export function saveAddresses(addresses) {
  try {
    const safe = Array.isArray(addresses) ? addresses : [];
    localStorage.setItem(scopedKey(ADDRESS_BOOK_STORAGE_KEY), JSON.stringify(safe));

    const selected = safe.find((addr) => addr?.isSelected);
    if (selected) {
      localStorage.setItem(scopedKey(SELECTED_ADDRESS_KEY), JSON.stringify(selected));
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('wasel_address_updated'));
    }

    return true;
  } catch (error) {
    console.error('❌ خطأ في حفظ دفتر العناوين:', error);
    return false;
  }
}

export function getSelectedAddress() {
  try {
    const raw = localStorage.getItem(scopedKey(SELECTED_ADDRESS_KEY));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('❌ خطأ في قراءة العنوان المختار:', error);
    return null;
  }
}

export function saveAddressFromRecipient({
  name = '',
  phone = '',
  address = '',
  senderName = '',
  senderPhone = '',
  senderCountry = 'الإمارات',
}) {
  const cleanName = String(name || '').trim();
  const cleanPhone = String(phone || '').trim();
  const cleanAddress = String(address || '').trim();

  if (!cleanName || !cleanAddress) {
    return { success: false, reason: 'missing_required' };
  }

  const addresses = getSavedAddresses();
  const cleanSenderName = String(senderName || '').trim();
  const cleanSenderPhone = String(senderPhone || '').trim();
  const cleanSenderCountry = String(senderCountry || 'الإمارات').trim() || 'الإمارات';
  const signature = `${cleanName}|${cleanPhone}|${cleanAddress}|${cleanSenderName}|${cleanSenderPhone}|${cleanSenderCountry}`.toLowerCase();

  const existing = addresses.find((addr) => {
    const currentSig = `${addr?.label || ''}|${addr?.phone || ''}|${addr?.street || ''}|${addr?.sender_name || ''}|${addr?.sender_phone || ''}|${addr?.sender_country || ''}`.toLowerCase();
    return currentSig === signature;
  });

  const normalized = addresses.map((addr) => ({ ...addr, isSelected: false }));

  if (existing) {
    const updated = normalized.map((addr) => (
      addr.id === existing.id
        ? {
            ...addr,
            label: cleanName,
            phone: cleanPhone,
            street: cleanAddress,
            sender_name: cleanSenderName,
            sender_phone: cleanSenderPhone,
            sender_country: cleanSenderCountry,
            isSelected: true,
            updatedAt: new Date().toISOString(),
          }
        : addr
    ));

    saveAddresses(updated);
    return { success: true, duplicated: true };
  }

  const newAddress = {
    id: Date.now().toString(),
    label: cleanName,
    phone: cleanPhone,
    street: cleanAddress,
    building: '',
    floor: '',
    notes: '',
    sender_name: cleanSenderName,
    sender_phone: cleanSenderPhone,
    sender_country: cleanSenderCountry,
    isSelected: true,
    source: 'cart',
    createdAt: new Date().toISOString(),
  };

  const updated = [newAddress, ...normalized];
  saveAddresses(updated);
  return { success: true, duplicated: false };
}
