# 🔑 شرح المفاتيح - Supabase API Keys

## الفرق بين Service Role و Anon Key

```
┌─────────────────────────────────────────────────────────┐
│                     SUPABASE KEYS                       │
├──────────────────────┬──────────────────────────────────┤
│ المفتاح              │ الاستخدام                       │
├──────────────────────┼──────────────────────────────────┤
│ Anon Key             │ في التطبيق الفرنتاند على       │
│ (بدون صلاحيات)      │ الإنترنت (Frontend)             │
│                      │ - دخول العملاء                  │
│                      │ - قراءة البيانات العامة         │
│                      │ - محدود الصلاحيات               │
├──────────────────────┼──────────────────────────────────┤
│ Service Role Key     │ في الخادم فقط! (Backend/Server) │
│ (صلاحيات كاملة)     │ - إنشاء مستخدمين Auth          │
│ ⚠️ سري جداً!        │ - تعديل البيانات الحساسة        │
│                      │ - عمليات إدارية                 │
│                      │ - ⚠️ لا تستخدمه في Frontend! │
└──────────────────────┴──────────────────────────────────┘
```

---

## 🔍 كيف تحصل على كل مفتاح؟

### **1️⃣ Project URL** (متاح للجميع - آمن)

Supabase Console:
```
Settings → API → Project URL
```

**يبدو مثل:**
```
https://ofdqkracfqakbtjjmksa.supabase.co
```

---

### **2️⃣ Anon Key** (للـ Frontend - محدود)

Supabase Console:
```
Settings → API → API Keys → Anon Key
```

**يبدو مثل:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**الاستخدام:**
```javascript
// في ملف .env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### **3️⃣ Service Role Key** (للـ Backend - كامل الصلاحيات ⚠️)

Supabase Console:
```
Settings → API → API Keys → Service Role Key
```

**يبدو مثل:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (طويل جداً)
```

⚠️ **هذا هو المفتاح الذي تحتاجه للـ Node.js Script**

---

## ⚠️ أين تحط كل مفتاح؟

```
┌─────────────────────────────────────────────────────────┐
│              Anon Key (محدود - آمن)                   │
├─────────────────────────────────────────────────────────┤
│ ✅ في ملف .env الفرنتاند                              │
│ ✅ في كود JavaScript الفرنتاند                        │
│ ✅ يمكن نشره العلن (GitHub, etc)                      │
│                                                         │
│ VITE_SUPABASE_ANON_KEY=...                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│        Service Role Key (كامل - سري جداً ⚠️)           │
├─────────────────────────────────────────────────────────┤
│ ❌ لا تحطه في ملف .env الفرنتاند                       │
│ ❌ لا تحطه في كود JavaScript العام                     │
│ ❌ لا تنشره عل GitHub!!                               │
│                                                         │
│ ✅ استخدمه فقط في:                                    │
│    - Node.js scripts (local)                           │
│    - خادم Backend (Server)                            │
│    - بيئة محدودة آمنة                                 │
│                                                         │
│ ⚠️ كاحتياط أمني:                                      │
│ - لا تشاركه لمع أحد                                    │
│ - احذفه بعد استخدامه من ملفات مؤقتة                  │
│ - إذا كشفت، غيّره من Supabase مباشرة                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 للـ Node.js Script (setup-admin-users.js)

تحتاج:
```javascript
const SUPABASE_URL = 'https://ofdqkracfqakbtjjmksa.supabase.co'; // ✅ آمن
const SERVICE_ROLE_KEY = 'eyJhbGci...'; // ⚠️ يجب أن يكون سري!
```

---

## 🔍 كيف تتأكد أن المفتاح صحيح؟

### ✅ Anon Key الصحيح
```
- يبدأ بـ: eyJhbGciOiJIUzI1NiIs...
- طول وسط (ليس قصير جداً، ليس طويل جداً)
- إذا استخدمته في الفرنتاند والتطبيق يعمل → صحيح
```

### ✅ Service Role Key الصحيح
```
- يبدأ بـ: eyJhbGciOiJIUzI1NiIs...
- طول جداً جداً (أطول من Anon Key)
- له صلاحيات إدارية (تستطيع إنشاء users)
```

---

## 🧪 اختبر المفتاح

### للتحقق من Service Role Key:

```javascript
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://your-project.supabase.co';
const SERVICE_ROLE_KEY = 'your-service-role-key';

// اختبر الاتصال
fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  headers: {
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  if (data.users) {
    console.log('✅ المفتاح صحيح! عدد المستخدمين:', data.users.length);
  } else if (data.error) {
    console.log('❌ خطأ:', data.error);
  }
});
```

---

## 📋 الملخص

```
تريد:                          استخدم:
─────────────────────────────────────────────────────
قراءة البيانات من الفرنتاند   → Anon Key
الدخول والتسجيل               → Anon Key
إثارة API للموظفين            → Anon Key

إنشاء مستخدمين من الخادم      → Service Role Key ⚠️
تعديل بيانات حساسة             → Service Role Key ⚠️
عمليات إدارية                  → Service Role Key ⚠️
```

---

## ⚠️ نصيحة ذهبية

```
❌ غلط:
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, ANON_KEY); // خطأ!
// هذا لن يعمل للعمليات الإدارية

✅ صحيح:
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, SERVICE_ROLE_KEY); // صحيح!
// هذا يعمل للعمليات الإدارية (في الخادم فقط!)
```

---

**الخلاصة:**
- **Anon Key** = مفتاح محدود للتطبيق
- **Service Role Key** = مفتاح سري كامل للخادم
- **Project URL** = عنوان المشروع (آمن)

استخدم الصحيح في المكان الصحيح! ✅
