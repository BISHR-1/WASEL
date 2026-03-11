import React from "react";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-[#F9FAF8] font-['Cairo'] pb-20" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#1B4332] mb-6 border-b-2 border-[#52B788] pb-2 inline-block">الشروط والأحكام للمستخدمين</h1>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#2D6A4F] mb-3">1. مقدمة</h2>
            <p>مرحباً بك في منصة "واصل". باستخدامك لتطبيقنا أو موقعنا الإلكتروني، فإنك توافق على الامتثال لهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، يُرجى التوقف عن استخدام المنصة.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2D6A4F] mb-3">2. إنشاء الحساب والمحفظة</h2>
            <p>يجب تقديم معلومات دقيقة عند إنشاء حسابك. أنت مسؤول عن الحفاظ على سرية بياناتك. رصيد المحفظة مخصص للاستخدام داخل التطبيق ولا يمكن تحويله إلى نقد أو سحبه خارج نطاق المنصة بطرق غير معتمدة.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2D6A4F] mb-3">3. الطلبات والتوصيل</h2>
            <p>الأسعار والأوقات المذكورة قابلة للتغيير. نحن نبذل قصارى جهدنا لضمان التوصيل في الوقت المحدد، ولكن قد تحدث تأخيرات خارجة عن إرادتنا. في حالة السلال المشتركة، يكون المستخدم المبدئي مسؤولاً عن صحة بيانات التوصيل.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2D6A4F] mb-3">4. سياسة الدفع والاسترجاع</h2>
            <p>نقبل الدفع عبر بوابات معتمدة مثل PayPal ورصيد المحفظة والدفع عند الاستلام. الاسترجاع يخضع لسياسة الإلغاء الخاصة بكل طلب، ويمكن أن يعاد المبلغ إلى محافظكم كـ "رصيد" وليس نقدياً بحسب الحالة.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2D6A4F] mb-3">5. الخصوصية والاستخدام المقبول</h2>
            <p>نحن نحترم خصوصيتك ونحمي بياناتك المرفوعة على المنصة. لا يُسمح باستخدام الخدمات لأي غرض غير قانوني أو ضار بأي شكل كان تجاه أي طرف ثالث. نحذر من أي سوء استخدام للمحفظة.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2D6A4F] mb-3">6. التعديلات</h2>
            <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعاركم بالتغييرات الجوهرية، واستمراركم في استخدام خدماتنا يعني قبولكم بالشروط الجديدة.</p>
          </section>
        </div>
      </div>
    </div>
  );
}