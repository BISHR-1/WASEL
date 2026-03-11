/**
 * دليل التكامل: حماية الصفحات من العملاء العاديين
 * Integration Guide: Protecting Staff Pages from Regular Customers
 */

/**
 * ====================================================================
 * الخطوة 1: تحديث App.jsx - التحقق من الوصول للصفحات
 * ====================================================================
 */

// قبل التحديث:
// <Route path={`/${path}`} element={<Page />} />

// بعد التحديث:
// <Route path={`/${path}`} element={
//   <ProtectedRoute pageName={path}>
//     <Page />
//   </ProtectedRoute>
// } />

/**
 * مثال من App.jsx:
 */

import ProtectedRoute from '@/components/ProtectedRoute';
import { isStaffLoggedIn } from '@/utils/roleBasedAccess';

export default function AppRoutes() {
  // ... الكود الموجود ...

  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />

      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <ProtectedRoute pageName={path}>
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />
      ))}

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

/**
 * ====================================================================
 * الخطوة 2: إخفاء روابط الموظفين من الملاح العام
 * ====================================================================
 */

// في ملف الملاح (Navigation/Header):

import { isStaffLoggedIn, isSupervisor, isDeliveryPerson, getStaffMenuItems } from '@/utils/roleBasedAccess';

export default function Navigation() {
  const isStaff = isStaffLoggedIn();

  return (
    <nav className="flex gap-4">
      {/* الروابط العامة - للجميع */}
      <a href="/">الرئيسية</a>
      <a href="/Restaurants">المطاعم</a>
      <a href="/Cart">السلة</a>

      {/* الروابط الموظفين - فقط إذا كان مسجل دخول */}
      {isStaff && isSupervisor() && (
        <>
          <a href="/AdminPanel">إدارة الطلبات</a>
          <a href="/SupervisorPanel">الخريطة الحية</a>
        </>
      )}

      {isStaff && isDeliveryPerson() && (
        <a href="/DriverPanel">لوحة الموصل</a>
      )}

      {/* زر تسجيل الدخول - فقط إذا لم يكن مسجل دخول */}
      {!isStaff && (
        <a href="/StaffLogin">دخول الموظفين</a>
      )}
    </nav>
  );
}

/**
 * ====================================================================
 * الخطوة 3: تحديث StaffLogin - إخفاء الخيار للعملاء العاديين
 * ====================================================================
 */

// StaffLogin.jsx يجب أن تحتوي على:

// 1️⃣ إخفاء زر "دخول الموظفين" من الملاح العام
//    - لا تضيف رابط مباشر في Navigation
//    - فقط يمكن الوصول عن طريق: /StaffLogin

// 2️⃣ رسالة واضحة عند دخول عميل عادي:
//    "هذه الصفحة خاصة بالموظفين والموصلين فقط"

// 3️⃣ زر "العودة" يأخذه للرئيسية
//
// 4️⃣ التسجيل جديد متاح فقط للموصلين. لا تُظهر حقول اختيار الدور.
//    إذا حاول أحدهم اختيار "مشرف" أو "مسؤول" فسيتم تجاهل الطلب
//    backend يتحقق ويرفض أي تسجيلٍ بأدوار غير الموصل.

/**
 * ====================================================================
 * الخطوة 4: مثال عملي - جدول الصفحات والوصول
 * ====================================================================
 */

/*
┌─────────────────────┬──────────────────────┬─────────────────────┬──────────────────┐
│ الصفحة              │ من يرى الرابط         │ من يستطيع الدخول    │ من يرى في الملاح │
├─────────────────────┼──────────────────────┼─────────────────────┼──────────────────┤
│ Home                │ الجميع               │ الجميع              │ الجميع           │
│ Restaurants         │ الجميع               │ الجميع              │ الجميع           │
│ Cart                │ الجميع               │ الجميع              │ الجميع           │
├─────────────────────┼──────────────────────┼─────────────────────┼──────────────────┤
│ StaffLogin          │ ---                  │ أي شخص              │ لا (يكتب URL)    │
│ DriverPanel         │ الموصلون فقط         │ الموصلون فقط        │ الموصلون         │
│ AdminPanel          │ المشرفون فقط         │ المشرفون فقط        │ المشرفون         │
│ SupervisorPanel     │ المشرفون فقط         │ المشرفون فقط        │ المشرفون         │
│ AdminOrders         │ المشرفون فقط         │ المشرفون فقط        │ المشرفون         │
└─────────────────────┴──────────────────────┴─────────────────────┴──────────────────┘
*/

/**
 * ====================================================================
 * الخطوة 5: تحديث الـ Layout - إظهار الملاح المناسب
 * ====================================================================
 */

// في Layout.jsx:

import { isStaffLoggedIn, getStaffMenuItems } from '@/utils/roleBasedAccess';

export default function Layout({ children, currentPageName }) {
  const isStaff = isStaffLoggedIn();
  const staffMenuItems = getStaffMenuItems();

  return (
    <div className="flex">
      {/* الملاح الجانبي للموظفين - فقط إذا كان مسجل دخول */}
      {isStaff && (
        <aside className="w-64 bg-slate-900 text-white p-6">
          <h2 className="text-2xl font-bold mb-8">واصل - الموظفين</h2>
          <nav className="space-y-4">
            {staffMenuItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`block px-4 py-2 rounded-lg transition-all ${
                  currentPageName === item.path
                    ? 'bg-purple-600'
                    : 'hover:bg-slate-800'
                }`}
              >
                {item.icon} {item.label}
              </a>
            ))}
          </nav>
        </aside>
      )}

      {/* المحتوى الرئيسي */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

/**
 * ====================================================================
 * ملخص: كيف يعمل النظام
 * ====================================================================
 */

/*
1. عميل عادي يدخل الموقع:
   ✅ يرى الصفحات العامة (الرئيسية، المطاعم، السلة)
   ❌ لا يرى أي رابط للموظفين
   ❌ إذا حاول الدخول للـ /AdminPanel يُرد للرئيسية

2. موظف يسجل دخول:
   ✅ يرى الصفحات الخاصة به (DriverPanel مثلاً)
   ✅ يرى الروابط الخاصة به في الملاح
   ❌ لا يستطيع الذهاب لصفحات أخرى (مثل AdminPanel إذا كان موصل)

3. مشرف يسجل دخول:
   ✅ يرى AdminPanel و SupervisorPanel و AdminOrders
   ✅ يرى سمات متقدمة (التصدير، إدارة الموصلين)
   ❌ نفسهم لا يستطيعون الوصول لـ DriverPanel الخاص بالموصل

*/
