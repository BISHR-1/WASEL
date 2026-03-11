/**
 * نظام الإشعارات الجذابة لجذب المستخدمين
 * Engaging Notifications System to Re-engage Users
 */

import { sendLocalNotification } from './pushNotifications';
import { addNotification } from './inAppNotifications';

/**
 * أنواع الإشعارات الجذابة
 */
const NOTIFICATION_TYPES = {
  SPECIAL_OFFER: 'special_offer',
  LIMITED_TIME: 'limited_time',
  NEW_PRODUCT: 'new_product',
  FAMILY_REMINDER: 'family_reminder',
  SEASONAL: 'seasonal',
  EXCLUSIVE: 'exclusive'
};
