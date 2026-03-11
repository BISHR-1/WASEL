import React from 'react';

export default function CourierTerms() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
          <h1 className="text-2xl font-black text-[#0F172A] mb-3">شروط وأحكام الموصل</h1>
          <p className="text-sm text-[#475569] mb-6">هذه الصفحة مخصصة لتعليم الموصل سياسة التطبيق وآلية استلام وتسليم الطلبات.</p>

          <div className="space-y-4 text-sm text-[#1E293B] leading-7">
            <p>1. يجب قبول الطلب ثم بدء التوصيل ثم رفع إثبات (صورة/فيديو) قبل إنهاء التسليم.</p>
            <p>2. يمنع مشاركة أسعار الطلب مع المستلم. تفاصيل الأسعار لا تظهر للموصل.</p>
            <p>3. عند وجود هدايا/باقات أو إلكترونيات يجب اتباع تعليمات المورد الظاهرة داخل الطلب.</p>
            <p>4. إثبات التسليم إلزامي لكل طلب، وأي طلب بدون إثبات قد يوقف استحقاق العمولة.</p>
            <p>5. العمولة الأساسية لكل طلب مكتمل هي 1.5 دولار، مع مكافأة 30 دولار لكل 40 طلب مكتمل.</p>
            <p>6. لا يحق تغيير دورة الراتب (أسبوعي/شهري) بعد اعتماد معلومات الموصل.</p>
            <p>7. أي إساءة استخدام للمنصة أو بيانات العملاء تعرض الحساب للتجميد الفوري.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
