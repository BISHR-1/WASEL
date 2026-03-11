import React from 'react';

export default function AdminTerms() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
          <h1 className="text-2xl font-black text-[#0F172A] mb-3">شروط وأحكام المشرف</h1>
          <p className="text-sm text-[#475569] mb-6">هذه الصفحة مخصصة لتعليم المشرف آلية إدارة الموصلين والطلبات والرواتب.</p>

          <div className="space-y-4 text-sm text-[#1E293B] leading-7">
            <p>1. فرز الطلبات للموصلين المؤهلين فقط (مكتملة بيانات الهوية والهاتف ودورة الراتب).</p>
            <p>2. لا يجوز مشاركة بيانات المستخدمين خارج إطار تنفيذ الطلب.</p>
            <p>3. المشرف مسؤول عن مراجعة الطلبات المكتملة والملغاة وغير المقبولة لكل موصل.</p>
            <p>4. يمكن للمشرف تنفيذ تصفير رصيد الموصل بعد تسديد الراتب وتوثيق العملية.</p>
            <p>5. يتم التعامل مع الطلبات وفق حالة الدفع المشتركة/العادية وسياسة الإشعارات المعتمدة.</p>
            <p>6. أي تعيين خاطئ أو تأخير إداري متكرر قد يؤثر على أداء المنصة ويجب معالجته فورا.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
