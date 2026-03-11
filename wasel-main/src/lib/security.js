// =====================================================
// WASEL - SECURITY MIDDLEWARE & UTILITIES
// File: src/lib/security.js
// =====================================================

// =====================================================
// INPUT VALIDATION
// =====================================================

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(input) {
  if (typeof input !== 'string') return input;
  
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'/]/g, char => htmlEntities[char]);
}

/**
 * Sanitize input for database queries
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[<>]/g, '') // Remove HTML brackets
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Syrian format)
 */
export function isValidPhone(phone) {
  // Syrian phone: +963 or 09xxxxxxxx
  const phoneRegex = /^(\+963|0)?9[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  const errors = [];
  
  if (password.length < 12) {
    errors.push('كلمة المرور يجب أن تكون 12 حرفاً على الأقل');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('يجب أن تحتوي على حرف كبير');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('يجب أن تحتوي على حرف صغير');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('يجب أن تحتوي على رقم');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('يجب أن تحتوي على رمز خاص');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
}

function calculatePasswordStrength(password) {
  let strength = 0;
  
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (password.length >= 16) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
  
  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  if (strength <= 6) return 'strong';
  return 'very-strong';
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// =====================================================
// CSRF PROTECTION
// =====================================================

const CSRF_TOKEN_KEY = 'wasel_csrf_token';

/**
 * Generate CSRF token
 */
export function generateCSRFToken() {
  const token = crypto.randomUUID();
  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  return token;
}

/**
 * Get current CSRF token
 */
export function getCSRFToken() {
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
  if (!token) {
    token = generateCSRFToken();
  }
  return token;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token) {
  const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
  return token === storedToken;
}

// =====================================================
// RATE LIMITING (Client-side)
// =====================================================

const rateLimitStore = new Map();

/**
 * Check if action is rate limited
 */
export function isRateLimited(action, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now();
  const key = `rate_limit_${action}`;
  
  let data = rateLimitStore.get(key);
  
  if (!data || now - data.windowStart > windowMs) {
    data = { count: 0, windowStart: now };
  }
  
  data.count++;
  rateLimitStore.set(key, data);
  
  return data.count > maxAttempts;
}

/**
 * Reset rate limit for action
 */
export function resetRateLimit(action) {
  const key = `rate_limit_${action}`;
  rateLimitStore.delete(key);
}

// =====================================================
// SECURE STORAGE
// =====================================================

const ENCRYPTION_PREFIX = 'enc:';

/**
 * Store sensitive data securely
 */
export function secureStore(key, value) {
  try {
    // For sensitive data, use sessionStorage (cleared on browser close)
    const data = JSON.stringify(value);
    // In production, you'd encrypt this with Web Crypto API
    sessionStorage.setItem(key, data);
  } catch (e) {
    console.error('Failed to store data securely:', e);
  }
}

/**
 * Retrieve sensitive data
 */
export function secureRetrieve(key) {
  try {
    const data = sessionStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to retrieve secure data:', e);
    return null;
  }
}

/**
 * Remove sensitive data
 */
export function secureRemove(key) {
  sessionStorage.removeItem(key);
}

// =====================================================
// XSS PROTECTION
// =====================================================

/**
 * Create safe HTML content
 */
export function createSafeHtml(content) {
  const div = document.createElement('div');
  div.textContent = content;
  return div.innerHTML;
}

/**
 * Check for potential XSS patterns
 */
export function containsXSS(input) {
  if (typeof input !== 'string') return false;
  
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /data:/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

// =====================================================
// SECURE HEADERS (for fetch requests)
// =====================================================

/**
 * Get secure headers for API requests
 */
export function getSecureHeaders(token = null) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-Token': getCSRFToken(),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// =====================================================
// IDEMPOTENCY
// =====================================================

const idempotencyStore = new Map();

/**
 * Generate idempotency key
 */
export function generateIdempotencyKey() {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

/**
 * Check if request was already made
 */
export function isIdempotent(key) {
  return idempotencyStore.has(key);
}

/**
 * Store idempotency result
 */
export function storeIdempotency(key, result, ttlMs = 3600000) {
  idempotencyStore.set(key, { result, expires: Date.now() + ttlMs });
  
  // Cleanup expired entries
  for (const [k, v] of idempotencyStore.entries()) {
    if (v.expires < Date.now()) {
      idempotencyStore.delete(k);
    }
  }
}

/**
 * Get idempotent result
 */
export function getIdempotentResult(key) {
  const entry = idempotencyStore.get(key);
  if (!entry || entry.expires < Date.now()) {
    idempotencyStore.delete(key);
    return null;
  }
  return entry.result;
}

// =====================================================
// CONTENT SECURITY POLICY HELPERS
// =====================================================

/**
 * Generate nonce for inline scripts
 */
export function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array));
}

// =====================================================
// AUDIT LOGGING (Client-side)
// =====================================================

const auditLog = [];
const MAX_AUDIT_LOG_SIZE = 100;

/**
 * Log security-relevant action
 */
export function logSecurityEvent(event, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  auditLog.push(entry);
  
  // Trim old entries
  while (auditLog.length > MAX_AUDIT_LOG_SIZE) {
    auditLog.shift();
  }
  
  // In production, send to server
  console.log('[Security Event]', entry);
}

/**
 * Get recent security events
 */
export function getSecurityEvents() {
  return [...auditLog];
}

// =====================================================
// SESSION MANAGEMENT
// =====================================================

const SESSION_TIMEOUT_KEY = 'wasel_session_timeout';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Update session activity
 */
export function updateSessionActivity() {
  sessionStorage.setItem(SESSION_TIMEOUT_KEY, Date.now().toString());
}

/**
 * Check if session is expired
 */
export function isSessionExpired() {
  const lastActivity = sessionStorage.getItem(SESSION_TIMEOUT_KEY);
  if (!lastActivity) return true;
  
  return Date.now() - parseInt(lastActivity) > SESSION_TIMEOUT_MS;
}

/**
 * Setup session timeout listener
 */
export function setupSessionTimeout(onTimeout) {
  // Check every minute
  setInterval(() => {
    if (isSessionExpired()) {
      logSecurityEvent('session_timeout');
      onTimeout?.();
    }
  }, 60000);
  
  // Update activity on user interaction
  ['click', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, updateSessionActivity, { passive: true });
  });
  
  updateSessionActivity();
}

// =====================================================
// EXPORTS
// =====================================================

export default {
  sanitizeHtml,
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  validatePassword,
  isValidUUID,
  generateCSRFToken,
  getCSRFToken,
  validateCSRFToken,
  isRateLimited,
  resetRateLimit,
  secureStore,
  secureRetrieve,
  secureRemove,
  createSafeHtml,
  containsXSS,
  getSecureHeaders,
  generateIdempotencyKey,
  isIdempotent,
  storeIdempotency,
  getIdempotentResult,
  generateNonce,
  logSecurityEvent,
  getSecurityEvents,
  updateSessionActivity,
  isSessionExpired,
  setupSessionTimeout
};
