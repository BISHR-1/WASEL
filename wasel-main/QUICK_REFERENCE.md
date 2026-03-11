# 📊 مرجع سريع: نظام الحماية

## الملفات الأساسية

```
src/
├── utils/
│   └── roleBasedAccess.js ←── كل دوال التحكم بالوصول
├── components/
│   └── ProtectedRoute.jsx ←── حماية المسارات
├── pages/
│   ├── StaffLogin.jsx ←── تسجيل الدخول (اختيار الدور)
│   ├── DriverPanel.jsx ←── لوحة الموصل (محمية)
│   ├── SupervisorPanel.jsx ←── لوحة المشرف (محمية)
│   └── StaffDashboard.jsx ←── لوحة المدير (مخفية، دور admin فقط)
└── INTEGRATION_GUIDE.js ←── دليل التكامل الكامل
```

---

## 🔄 سير العمل

### عندما يحاول أي شخص الدخول لصفحة محمية:

```
User visits /AdminPanel
    ↓
ProtectedRoute checks: canAccessPage('AdminPanel')
    ↓
    ├─ Not logged in? 
    │   → Show: "عذراً، يجب عليك تسجيل الدخول أولاً"
    │   → Button: "تسجيل الدخول" → /StaffLogin
    │
    ├─ Logged in but wrong role?
    │   → Show: "هذه الصفحة متاحة فقط للمشرفين"
    │   → Button: "العودة للرئيسية" → /
    │
    └─ Has correct role?
        → Show: AdminPanel ✅
```

---

## 📝 أكواد مرجعية سريعة

### التحقق من الدور
```javascript
import { isSupervisor, isDeliveryPerson, hasRole } from '@/utils/roleBasedAccess';

// هل هو مشرف؟
if (isSupervisor()) {
  // عرض أدوات المشرفين
}

// هل هو موصل؟
if (isDeliveryPerson()) {
  // عرض لوحة الموصل
}

// هل لديه دور محدد؟
if (hasRole('supervisor')) {
  // افعل شيء معين
}
```

### حماية مسار
```jsx
<ProtectedRoute pageName="AdminPanel">
  <AdminPanel />
</ProtectedRoute>
```

### إظهار/إخفاء عناصر بناءً على الدور
```jsx
import { isSupervisor } from '@/utils/roleBasedAccess';

<div>
  {isSupervisor() && (
    <a href="/AdminPanel">إدارة الطلبات</a>
  )}
</div>
```

### إضافة صفحة جديدة محمية
1. أنشئ الصفحة في `src/pages/MyNewPage.jsx`
2. أضفها في `src/pages.config.js`
3. أضفها في `PAGE_ACCESS` في `src/utils/roleBasedAccess.js`
4. غلفها بـ `<ProtectedRoute>` في `App.jsx`

---

## 🎯 ملخص الأدوار

| الدور | يستطيع الوصول |
|------|--------------|
| **العميل العادي** | Home, Restaurants, Cart |
| **الموصل** | DriverPanel |
| **المشرف** | SupervisorPanel |
| **المدير** | StaffDashboard |
---

## 🚨 تنبيهات مهمة

1. **لا تضيف روابط الموظفين في الملاح العام!**
   ```jsx
   // ❌ خطأ:
   <a href="/AdminPanel">Admin</a>
   
   // ✅ صحيح:
   {isSupervisor() && <a href="/AdminPanel">Admin</a>}
   ```

2. **استخدم ProtectedRoute دائماً لصفحات الموظفين**
   ```jsx
   // ❌ خطأ - لا حماية:
   <Route path="/AdminPanel" element={<AdminPanel />} />
   
   // ✅ صحيح - محمية:
   <Route path="/AdminPanel" element={
     <ProtectedRoute pageName="AdminPanel">
       <AdminPanel />
     </ProtectedRoute>
   } />
   ```

3. **الفحص في الجانب الأمامي فقط للـ UX**
   ```javascript
   // يجب أن يكون لديك فحص في الـ Backend أيضاً!
   // هذا نظام Frontend فقط
   ```

---

## 📞 الدوال المتاحة

### من `roleBasedAccess.js`

```javascript
// الفحص
canAccessPage(pageName)              // هل يمكن الوصول؟
getAccessDeniedMessage(pageName)     // الرسالة المناسبة

// البيانات
getStaffMenuItems()                  // عناصر الملاح

// الأدوار
isSupervisor()                       // هل مشرف؟
isDeliveryPerson()                   // هل موصل؟
hasRole(role)                        // هل له دور محدد؟
hasAnyRole([role1, role2])          // هل له أحد الأدوار؟
isStaffLoggedIn()                    // هل مسجل دخول؟
```

---

## 🔐 آلية الأمان

1. **الفحص المبدئي**: عند تحميل الصفحة، يتحقق من الجلسة
2. **إعادة التوجيه**: إذا انتهت الجلسة، يُرجع العودة لـ StaffLogin
3. **رسائل واضحة**: يعرف المستخدم تماماً لماذا لا يستطيع الدخول
4. **عدم إظهار**: المعلومات السرية لا تظهر في الملاح

---

## ✨ الفرق قبل وبعد

### قبل (بدون نظام حماية)
```
العميل يكتب /AdminPanel
→ يشوف لوحة المشرف!!! ❌
```

### بعد (مع نظام الحماية)
```
العميل يكتب /AdminPanel
→ يفحص النظام: هل أنت موظف؟ لا
→ يعرض رسالة: "اسف، صفحة محمية"
→ يأخذه للرئيسية ✅
```

---

## 📈 الخطوات التالية

1. ✅ التحقق من أن `roleBasedAccess.js` موجود
2. ✅ التحقق من أن `ProtectedRoute.jsx` موجود
3. ⏳ تحديث `App.jsx` لتغليف المسارات
4. ⏳ تحديث الملاح لإظهار الروابط المناسبة
5. ⏳ اختبار كل سيناريو

---

## 🧪 اختبارات

### اختبر كعميل عادي:
- [ ] الصفحات العامة تظهر بشكل طبيعي
- [ ] ما فيش روابط موظفين في الملاح
- [ ] إذا حاولت /AdminPanel، يعرض رسالة خطأ
- [ ] تسجيل الدخول كموظف يشتغل

### اختبر كموصل:
- [ ] ترى DriverPanel في الملاح
- [ ] ما تقدر تشوف AdminPanel
- [ ] تقدر تحدّث حالة الطلبات

### اختبر كمشرف:
- [ ] ترى AdminPanel و SupervisorPanel
- [ ] ما تقدر تشوف DriverPanel
- [ ] تقدر تُصدّر الطلبات

---

## 💾 المتغيرات العامة

```javascript
// في localStorage (آمن نسبياً):
localStorage.getItem('admin_session')
localStorage.getItem('admin_user')

// يفحص عند:
- تحميل الصفحة
- الذهاب لصفحة جديدة
- تحديث (F5)
```
