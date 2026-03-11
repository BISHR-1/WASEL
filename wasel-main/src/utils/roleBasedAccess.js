/**
 * نظام التحكم في الوصول بناءً على الأدوار
 * Role-Based Access Control (RBAC)
 */

import { getCurrentAdminUser } from './adminAuth';

export const ADMIN_ROLES = {
  SUPERVISOR: 'supervisor',        // مشرف - يدير الطلبات والموصلين
  DELIVERY_PERSON: 'delivery_person', // موصل - يستقبل الطلبات
  SUPPLIER: 'supplier',            // مورد - (للمستقبل)
  ADMIN: 'admin'                   // مسؤول النظام
};

/**
 * قائمة الأدوار المسموحة لكل صفحة
 */
export const PAGE_ACCESS = {
  'StaffLogin': ['public'],           // متاح للجميع لكن بدون تسجيل
  // dashboard view used by manager/admin only
  'StaffDashboard': [ADMIN_ROLES.ADMIN],
  // specific panels for drivers and supervisors
  'DriverPanel': [ADMIN_ROLES.DELIVERY_PERSON],
  'SupervisorPanel': [ADMIN_ROLES.SUPERVISOR],
  // legacy base44 admin pages (keep unaffected but manager only)
  'AdminPanel': [ADMIN_ROLES.ADMIN],
  'AdminOrders': [ADMIN_ROLES.ADMIN],
  'AdminReports': [ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPERVISOR],
};

/**
 * التحقق من أن المستخدم لديه صلاحية للوصول للصفحة
 * @param {string} pageName - اسم الصفحة
 * @returns {boolean} هل لديه صلاحية؟
 */
export function canAccessPage(pageName) {
  // إذا لم تكن الصفحة محمية، السماح بالوصول
  if (!PAGE_ACCESS[pageName]) {
    return true;
  }

  // إذا كانت الصفحة للعامة، السماح بالوصول
  if (PAGE_ACCESS[pageName].includes('public')) {
    return true;
  }

  // التحقق من أن المستخدم مسجل دخول
  const user = getCurrentAdminUser();
  if (!user) {
    return false;
  }

  // التحقق من أن دور المستخدم مسموح
  return PAGE_ACCESS[pageName].includes(user.role);
}

/**
 * الحصول على رسالة خطأ مناسبة
 * @param {string} pageName - اسم الصفحة
 * @returns {string} رسالة الخطأ
 */
export function getAccessDeniedMessage(pageName) {
  const user = getCurrentAdminUser();

  if (!user) {
    return 'عذراً، يجب عليك تسجيل الدخول أولاً.';
  }

  if (pageName === 'DriverPanel') {
    return 'هذه الصفحة متاحة فقط للموصلين.';
  }

  if (pageName === 'AdminPanel' || pageName === 'AdminOrders') {
    return 'هذه الصفحة متاحة فقط للمديرين.';
  }

  if (pageName === 'SupervisorPanel') {
    return 'هذه الصفحة متاحة فقط للمشرفين.';
  }

  return 'ليس لديك صلاحية للوصول لهذه الصفحة.';
}

/**
 * قائمة الروابط التي يجب عرضها بناءً على دور المستخدم
 * @returns {Array} قائمة العناصر في القائمة الجانبية
 */
export function getStaffMenuItems() {
  const user = getCurrentAdminUser();

  if (!user) {
    return []; // لا تُظهر أي عناصر للعملاء العاديين
  }

  const menuItems = [
    // everyone who is logged sees a home link (redirects later)
    {
      icon: '🏠',
      label: 'الرئيسية',
      path: '/',
      roles: [ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPERVISOR, ADMIN_ROLES.DELIVERY_PERSON]
    }
  ];

  // driver menu
  if (user.role === ADMIN_ROLES.DELIVERY_PERSON) {
    menuItems.push({
      icon: '🚗',
      label: 'لوحة الموصل',
      path: '/DriverPanel',
      roles: [ADMIN_ROLES.DELIVERY_PERSON]
    });
  }

  // supervisor menu
  if (user.role === ADMIN_ROLES.SUPERVISOR) {
    menuItems.push({
      icon: '🗺️',
      label: 'لوحة المشرف',
      path: '/SupervisorPanel',
      roles: [ADMIN_ROLES.SUPERVISOR]
    });
  }

  // manager/admin menu
  if (user.role === ADMIN_ROLES.ADMIN) {
    menuItems.push(
      {
        icon: '🛠️',
        label: 'لوحة المدير',
        path: '/StaffDashboard',
        roles: [ADMIN_ROLES.ADMIN]
      }
    );
  }

  return menuItems.filter(item => item.roles.includes(user.role));
}

/**
 * التحقق من أن المستخدم يملك دوراً محدداً
 * @param {string} role - الدور المطلوب
 * @returns {boolean}
 */
export function hasRole(role) {
  const user = getCurrentAdminUser();
  return user && user.role === role;
}

/**
 * التحقق من أن المستخدم يملك أحد الأدوار
 * @param {Array<string>} roles - قائمة الأدوار
 * @returns {boolean}
 */
export function hasAnyRole(roles) {
  const user = getCurrentAdminUser();
  return user && roles.includes(user.role);
}

/**
 * هل المستخدم مشرف أو أعلى؟
 * @returns {boolean}
 */
export function isSupervisor() {
  const user = getCurrentAdminUser();
  return user && (user.role === ADMIN_ROLES.SUPERVISOR || user.role === ADMIN_ROLES.ADMIN);
}

/**
 * هل المستخدم موصل؟
 * @returns {boolean}
 */
export function isDeliveryPerson() {
  return hasRole(ADMIN_ROLES.DELIVERY_PERSON);
}

/**
 * هل المستخدم مسجل دخول كموظف؟
 * @returns {boolean}
 */
export function isStaffLoggedIn() {
  return getCurrentAdminUser() !== null;
}
