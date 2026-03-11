/**
 * مثال حقيقي: كيفية تحديث App.jsx للحماية الكاملة
 * Real Example: How to Update App.jsx for Full Protection
 */

// ============================================================
// الملف: src/App.jsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

// ✅ استيراد مكون الحماية
import ProtectedRoute from '@/components/ProtectedRoute';
import { isStaffLoggedIn } from '@/utils/roleBasedAccess';

import { pagesConfig } from '@/pages.config.js';
import LayoutWrapper from '@/components/LayoutWrapper';
import PageNotFound from '@/pages/PageNotFound';

// ============================================================
// الكود الأساسي (موجود بالفعل)
// ============================================================

export const AppContentWithRoutes = ({ mainPageKey, Pages, Layout: MainLayout }) => {
  return (
    <Routes>
      {/* الصفحة الرئيسية - بدون حماية */}
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <Pages[mainPageKey] />
        </LayoutWrapper>
      } />

      {/* جميع الصفحات الأخرى - مع الحماية */}
      {Object.entries(Pages).map(([path, Page]) => {
        // 🔐 قائمة الصفحات التي تحتاج حماية
        const protectedPages = [
          'StaffLogin',      // تسجيل الدخول (يحتاج حماية لتجنب ظهوره للموظفين المسجلين)
          'DriverPanel',     // لوحة الموصل
          'AdminPanel',      // لوحة المشرف
          'SupervisorPanel', // لوحة الإشراف
          'AdminOrders',     // قائمة الطلبات
          'StaffDashboard'   // لوحة الموظفين العامة
        ];

        const isProtected = protectedPages.includes(path);

        return (
          <Route
            key={path}
            path={`/${path}`}
            element={
              isProtected ? (
                // 🔒 المسار محمي
                <ProtectedRoute pageName={path}>
                  <LayoutWrapper currentPageName={path}>
                    <Page />
                  </LayoutWrapper>
                </ProtectedRoute>
              ) : (
                // ✅ المسار عام
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              )
            }
          />
        );
      })}

      {/* صفحة 404 - بدون حماية */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

// ============================================================
// خيار بديل: حماية تلقائية لصفحات معينة فقط
// ============================================================

/**
 * إذا كنت تريد تبسيط الكود، استخدم دالة مساعدة:
 */

function isStaffPage(pageName) {
  // قائمة الصفحات التي خاصة بالموظفين
  const staffPages = [
    'StaffLogin',
    'DriverPanel',
    'AdminPanel',
    'SupervisorPanel',
    'AdminOrders',
    'StaffDashboard'
  ];
  return staffPages.includes(pageName);
}

export const AppContentWithRoutesSimplified = ({ mainPageKey, Pages, Layout: MainLayout }) => {
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <Pages[mainPageKey] />
        </LayoutWrapper>
      } />

      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            isStaffPage(path) ? (
              <ProtectedRoute pageName={path}>
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              </ProtectedRoute>
            ) : (
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            )
          }
        />
      ))}

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

// ============================================================
// خيار ثالث: حماية شاملة لكل الصفحات
// ============================================================

/**
 * إذا كنت تريد حماية جميع الصفحات (حتى الصفحات العامة تتطلب تحقق):
 */

export const AppContentWithFullProtection = ({ mainPageKey, Pages, Layout: MainLayout }) => {
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute pageName="Home">
          <LayoutWrapper currentPageName={mainPageKey}>
            <Pages[mainPageKey] />
          </LayoutWrapper>
        </ProtectedRoute>
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
};

// ============================================================
// الاستخدام في App الرئيسي
// ============================================================

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <AppContentWithRoutes
        mainPageKey={pagesConfig.mainPage}
        Pages={pagesConfig.Pages}
        Layout={pagesConfig.Layout}
      />
    </Router>
  );
}

export default App;

// ============================================================
// أمثلة إضافية: حماية الـ Navigation
// ============================================================

/**
 * الملف: src/components/Navigation.jsx
 */

import { isStaffLoggedIn, isSupervisor, isDeliveryPerson } from '@/utils/roleBasedAccess';

export default function Navigation() {
  const isStaff = isStaffLoggedIn();

  return (
    <nav className="flex gap-4 p-4 bg-white shadow">
      {/* الروابط العامة - للجميع */}
      <a href="/" className="px-4 py-2">الرئيسية</a>
      <a href="/Restaurants" className="px-4 py-2">المطاعم</a>
      <a href="/Cart" className="px-4 py-2">السلة</a>

      {/* فاصل */}
      <div className="flex-1"></div>

      {/* روابط الموظفين - فقط للموظفين */}
      {isStaff && (
        <>
          {isSupervisor() && (
            <>
              <a href="/AdminPanel" className="px-4 py-2 bg-purple-100">
                إدارة الطلبات
              </a>
              <a href="/SupervisorPanel" className="px-4 py-2 bg-purple-100">
                الخريطة الحية
              </a>
            </>
          )}

          {isDeliveryPerson() && (
            <a href="/DriverPanel" className="px-4 py-2 bg-green-100">
              لوحة الموصل
            </a>
          )}

          {/* زر خروج */}
          <button
            onClick={() => {
              localStorage.removeItem('admin_session');
              localStorage.removeItem('admin_user');
              window.location.href = '/';
            }}
            className="px-4 py-2 bg-red-100"
          >
            تسجيل الخروج
          </button>
        </>
      )}

      {/* زر دخول الموظفين - فقط للعملاء العاديين */}
      {!isStaff && (
        <a href="/StaffLogin" className="px-4 py-2 bg-blue-100">
          دخول الموظفين
        </a>
      )}
    </nav>
  );
}

// ============================================================
// اختبار: تحقق من أن كل شيء يعمل
// ============================================================

/*
├─ اختبر أنك عميل عادي:
│  ├─ الصفحات العامة تفتح ✅
│  ├─ روابط الموظفين ما تظهر ✅
│  └─ /AdminPanel يرد ل /Home ✅
│
├─ اختبر أنك موصل:
│  ├─ /DriverPanel يفتح ✅
│  ├─ /AdminPanel يرد لك ❌
│  └─ تشوف الملاح الخاص بك ✅
│
└─ اختبر أنك مشرف:
   ├─ /AdminPanel يفتح ✅
   ├─ /DriverPanel يرد لك ❌
   └─ تشوف جميع الأدوات ✅
*/
