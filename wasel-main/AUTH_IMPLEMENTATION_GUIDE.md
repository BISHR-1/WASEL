# نظام المصادقة الجديد - دليل التنفيذ

## التغييرات المطبقة ✅

### 1. تصميم جديد بألوان فاتحة
- **الألوان القديمة**: ذهبي (#FDB813، #FFA000)
- **الألوان الجديدة**: رمادي فاتح (gray-50, gray-100, gray-200)
- **اللون المميز**: أزرق (blue-400, blue-500, blue-600)
- السبب: لإظهار شخصية واصل بوضوح أكثر

### 2. العلامة التجارية المحدثة
- **الاسم القديم**: وصل
- **الاسم الجديد**: واصل || Wasel
- **الشعار القديم**: توصيل السعادة لأحبائك
- **الشعار الجديد**: نوصل حبك لحد الباب 💙

### 3. نظام المصادقة الجديد
قمنا بفصل التسجيل عن تسجيل الدخول:

#### أ) التسجيل (Signup):
1. المستخدم يدخل: بريد إلكتروني + كلمة مرور
2. يضغط "متابعة"
3. يُرسل كود OTP للبريد الإلكتروني
4. المستخدم يدخل الكود للتحقق
5. يتم إنشاء الحساب

#### ب) تسجيل الدخول (Login):
1. المستخدم يدخل: بريد إلكتروني + كلمة مرور
2. يضغط "تسجيل الدخول"
3. يتم التحقق مباشرة (بدون OTP)
4. يدخل التطبيق

#### ج) نسيت كلمة المرور:
1. المستخدم يضغط "نسيت كلمة المرور؟"
2. يدخل البريد الإلكتروني
3. يُرسل كود OTP
4. يدخل الكود + كلمة المرور الجديدة
5. يتم تحديث كلمة المرور

### 4. المكونات المحدثة
- ✅ `AnimatedLoginCard.jsx` - نموذج التسجيل (signup)
- ✅ `LoginCard.jsx` - نموذج تسجيل الدخول (login)
- ✅ `EmailOtpLogin.jsx` - منسق المصادقة الرئيسي

---

## المطلوب تنفيذه في Supabase 🔧

### الخطوة 1: إنشاء جدول المستخدمين

قم بتنفيذ ملف `USERS_TABLE.sql` في Supabase:

```sql
-- في Supabase Dashboard > SQL Editor
-- انسخ محتوى ملف USERS_TABLE.sql وقم بتشغيله
```

هذا الملف سيقوم بـ:
- إنشاء جدول `users` لحفظ بيانات المستخدمين
- إضافة فهرس (index) للبريد الإلكتروني للبحث السريع
- إضافة trigger لتحديث `updated_at` تلقائيًا
- تفعيل Row Level Security للأمان
- إضافة سياسات (policies) للسماح للمستخدمين بقراءة/تحديث بياناتهم فقط

### الخطوة 2: تثبيت مكتبة تشفير كلمات المرور

في التطبيق، نحتاج لتثبيت مكتبة لتشفير كلمات المرور:

```bash
npm install bcryptjs
# أو
npm install argon2
```

### الخطوة 3: إنشاء دوال المصادقة

أنشئ ملف جديد: `src/lib/auth.js`

```javascript
import bcrypt from 'bcryptjs';
import { supabase } from './supabase';
import { sendEmailOtp, verifyEmailOtp } from './otpAuth';

/**
 * تسجيل مستخدم جديد
 * 1. إرسال كود OTP للبريد
 * 2. بعد التحقق، حفظ المستخدم بكلمة المرور المشفرة
 */
export async function signup(email, password) {
  try {
    // إرسال OTP
    const otpResponse = await sendEmailOtp(email);
    
    if (!otpResponse.success) {
      throw new Error(otpResponse.error || 'فشل إرسال كود التحقق');
    }
    
    return {
      success: true,
      token: otpResponse.token,
      message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * تأكيد التسجيل بعد التحقق من OTP
 */
export async function confirmSignup(email, code, token, password) {
  try {
    // التحقق من OTP
    const verifyResponse = await verifyEmailOtp(email, code, token);
    
    if (!verifyResponse.success) {
      throw new Error(verifyResponse.error || 'الكود غير صحيح');
    }
    
    // تشفير كلمة المرور
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // حفظ المستخدم في قاعدة البيانات
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        is_verified: true
      }])
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return {
      success: true,
      user: data,
      sessionToken: verifyResponse.sessionToken,
      sessionExpiresAt: verifyResponse.sessionExpiresAt
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * تسجيل الدخول بكلمة المرور
 */
export async function login(email, password) {
  try {
    // البحث عن المستخدم
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();
    
    if (error || !user) {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
    
    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
    
    // إنشاء session token (يمكن استخدام JWT)
    const sessionToken = generateSessionToken(user.id);
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 يوم
    
    return {
      success: true,
      user,
      sessionToken,
      sessionExpiresAt
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * إرسال كود لإعادة تعيين كلمة المرور
 */
export async function requestPasswordReset(email) {
  try {
    // التحقق من وجود المستخدم
    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single();
    
    if (error || !user) {
      throw new Error('البريد الإلكتروني غير مسجل');
    }
    
    // إرسال OTP
    const otpResponse = await sendEmailOtp(email);
    
    if (!otpResponse.success) {
      throw new Error(otpResponse.error || 'فشل إرسال كود التحقق');
    }
    
    return {
      success: true,
      token: otpResponse.token,
      message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * إعادة تعيين كلمة المرور بعد التحقق من OTP
 */
export async function resetPassword(email, code, token, newPassword) {
  try {
    // التحقق من OTP
    const verifyResponse = await verifyEmailOtp(email, code, token);
    
    if (!verifyResponse.success) {
      throw new Error(verifyResponse.error || 'الكود غير صحيح');
    }
    
    // تشفير كلمة المرور الجديدة
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // تحديث كلمة المرور
    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('email', email.toLowerCase().trim());
    
    if (error) {
      throw new Error(error.message);
    }
    
    return {
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * إنشاء session token (مؤقت - يفضل استخدام JWT)
 */
function generateSessionToken(userId) {
  return `session_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
```

### الخطوة 4: تحديث EmailOtpLogin.jsx

استبدل الدوال TODO بالدوال الحقيقية:

```javascript
import { signup, confirmSignup, login, requestPasswordReset, resetPassword } from '../../lib/auth';

// في handleSend (signup)
const handleSend = async (e) => {
  e?.preventDefault?.();
  if (!email || !password) {
    return setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
  }
  
  if (password.length < 6) {
    return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  }
  
  setError('');
  setLoading(true);
  try {
    const response = await signup(email.trim(), password);
    if (response?.success && response?.token) {
      setToken(response.token);
      setStep('verify');
    } else {
      throw new Error(response?.error || 'حدث خطأ في التسجيل');
    }
  } catch (err) {
    setError(err?.message || 'فشل التسجيل');
  } finally {
    setLoading(false);
  }
};

// في handleLogin
const handleLogin = async (e) => {
  e?.preventDefault?.();
  if (!email || !password) {
    return setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
  }
  
  setError('');
  setLoading(true);
  try {
    const response = await login(email.trim(), password);
    if (response?.success && response?.sessionToken) {
      setOtpSession({
        token: response.sessionToken,
        email: email.trim(),
        exp: response.sessionExpiresAt
      });
      onSuccess?.();
    } else {
      throw new Error(response?.error || 'فشل تسجيل الدخول');
    }
  } catch (err) {
    setError(err?.message || 'فشل تسجيل الدخول');
  } finally {
    setLoading(false);
  }
};

// في handleForgotPassword
const handleForgotPassword = async (e) => {
  e?.preventDefault?.();
  if (!email) return setError('الرجاء إدخال البريد الإلكتروني');
  
  setError('');
  setLoading(true);
  try {
    const response = await requestPasswordReset(email.trim());
    if (response?.success && response?.token) {
      setToken(response.token);
      setStep('verify');
      setMode('forgot');
    } else {
      throw new Error(response?.error || 'حدث خطأ في الإرسال');
    }
  } catch (err) {
    setError(err?.message || 'فشل إرسال الكود');
  } finally {
    setLoading(false);
  }
};

// في handleVerify - تحديث حسب الوضع (mode)
const handleVerify = async (e) => {
  e?.preventDefault?.();
  if (!code || code.length < 6) return;

  setError('');
  setLoading(true);
  try {
    if (mode === 'signup') {
      // تأكيد التسجيل
      const response = await confirmSignup(email.trim(), code.trim(), token, password);
      if (response?.success) {
        setOtpSession({
          token: response.sessionToken,
          email: email.trim(),
          exp: response.sessionExpiresAt
        });
        onSuccess?.();
      } else {
        throw new Error(response?.error || 'الكود غير صحيح');
      }
    } else if (mode === 'forgot') {
      // إعادة تعيين كلمة المرور
      const response = await resetPassword(email.trim(), code.trim(), token, password);
      if (response?.success) {
        // العودة لصفحة تسجيل الدخول
        setMode('login');
        setStep('auth');
        setError('');
        setCode('');
      } else {
        throw new Error(response?.error || 'الكود غير صحيح');
      }
    }
  } catch (err) {
    setError(err?.message || 'الكود غير صحيح');
  } finally {
    setLoading(false);
  }
};
```

---

## ملخص سريع 📋

### ما تم إنجازه:
- ✅ تغيير الألوان من ذهبي إلى رمادي فاتح
- ✅ تحديث العلامة التجارية "واصل || Wasel"
- ✅ شعار جديد "نوصل حبك لحد الباب 💙"
- ✅ فصل نموذج التسجيل عن تسجيل الدخول
- ✅ إضافة حقل كلمة المرور مع إظهار/إخفاء
- ✅ إضافة زر "لدي حساب" في صفحة التسجيل
- ✅ إضافة رابط "نسيت كلمة المرور؟" في صفحة تسجيل الدخول

### ما يحتاج تنفيذ في Supabase:
1. ❌ تشغيل ملف `USERS_TABLE.sql` في Supabase
2. ❌ تثبيت `npm install bcryptjs`
3. ❌ إنشاء ملف `src/lib/auth.js` بالدوال أعلاه
4. ❌ تحديث الدوال في `EmailOtpLogin.jsx`

### اختبار التطبيق:
```bash
# بناء التطبيق
npm run build

# مزامنة مع Android
npx cap sync android

# تشغيل على الجهاز
npx cap run android
```

---

## ملاحظات مهمة 🔒

1. **الأمان**: كلمات المرور مشفرة ب bcrypt (لا تُحفظ كنص صريح أبدًا)
2. **التحقق**: يتم التحقق من البريد الإلكتروني عبر OTP قبل إنشاء الحساب
3. **Session**: يمكن تحسين الـ session token باستخدام JWT لاحقًا
4. **RLS**: Row Level Security مفعّل لحماية بيانات المستخدمين

هل تريد أن أساعدك في تنفيذ أي من هذه الخطوات؟
