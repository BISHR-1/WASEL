
import crypto from 'crypto';

// Configuration: Ensure these are set in environment variables
const ENCRYPTION_KEY = process.env.KMS_KEY || ''; // Must be 32 bytes for AES-256
const ALGORITHM = 'aes-256-gcm';

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.warn('WARNING: KMS_KEY is missing or invalid length (must be 32 chars/bytes). Security functions will fail.');
}

export interface EncryptedData {
  iv: string; // Hex
  tag: string; // Hex
  content: string; // Hex
}

/**
 * Encrypts a text message using AES-256-GCM.
 * @param text The cleartext message
 * @returns Object containing iv, auth tag, and encrypted content in hex
 */
export function encryptMessage(text: string): EncryptedData {
  // Generate a random 12-byte initialization vector (IV)
  const iv = crypto.randomBytes(12);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  // Encrypt
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get auth tag
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    content: encrypted
  };
}

/**
 * Decrypts a message using AES-256-GCM.
 * @param encryptedData Object with iv, tag, and content from DB
 * @returns Original cleartext string
 */
export function decryptMessage(encryptedData: EncryptedData): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    Buffer.from(ENCRYPTION_KEY), 
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Sanitize input to prevent basic XSS/Injection before processing.
 * strict mode removes almost everything unsafe.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  // Basic strict auditing: remove potential script tags or on* attributes
  // For HTML content, use a dedicated library like DOMPurify
  return input
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    .replace(/<[^>]+>/g, "") // Strip all HTML tags
    .trim();
}
