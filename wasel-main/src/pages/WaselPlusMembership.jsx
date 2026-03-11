import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import AppFooter from '@/components/common/AppFooter';
import { CheckCircle2, Crown, Sparkles, CalendarDays, BadgeDollarSign, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import PayPalSubscriptionButton from '@/components/payment/PayPalSubscriptionButton';
import { supabase } from '@/lib/supabase';
import { getUserRegion, isInsideSyria } from '@/lib/userRegion';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';

const WHATSAPP_NUMBER = '971502406519';
const WHATSAPP_BASE_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

const MEMBERSHIP_BENEFITS = [
  'توصيل مجاني على جميع الطلبات بدون حد أدنى',
  'توصيل سريع خلال يوم واحد للطلبات المؤهلة',
  'إمكانية تحديد يوم ووقت التسليم حسب رغبة العميل',
  'خصم 20٪ على طلبات الهدايا والباقات',
  'خصم 10٪ على طلبات المطاعم',
  'خصم 10٪ على طلبات الإلكترونيات',
  'خصم 20٪ على طلبات السوبر ماركت',
  'عروض وخصومات حصرية للأعضاء فقط داخل التطبيق',
  'أولوية في معالجة الطلبات وخدمة العملاء',
  'مكافآت ونقاط على كل طلب يمكن تحويلها إلى رصيد في التطبيق',
  'مفاجآت وكوبونات شهرية خاصة بأعضاء Wasel+',
];

const PLAN_OPTIONS = {
  monthly: {
    key: 'monthly',
    label: '10 دولار شهريًا',
    priceUSD: 10,
    periodDays: 30,
    planId: import.meta.env.VITE_PAYPAL_PLAN_ID_MONTHLY || 'P-5312668172383512YNGWZITI',
  },
  yearly: {
    key: 'yearly',
    label: '100 دولار سنويًا (توفير 20%)',
    priceUSD: 100,
    periodDays: 365,
    planId: import.meta.env.VITE_PAYPAL_PLAN_ID_YEARLY || 'P-07V2260350437010ANGWZQFY',
  },
};

function addDays(baseDate, days) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date;
}

function generateSubscriptionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'WP-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function WaselPlusMembership() {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const [savingPayPal, setSavingPayPal] = useState(false);
  const [memberState, setMemberState] = useState(null);
  const [userRegion, setUserRegion] = useState(null);

  const plan = PLAN_OPTIONS[selectedPlan];
  const insideSyria = isInsideSyria(userRegion);

  useEffect(() => {
    setUserRegion(getUserRegion());
  }, []);

  useEffect(() => {
    if (insideSyria && paymentMethod === 'paypal') {
      setPaymentMethod('whatsapp');
    }
  }, [insideSyria, paymentMethod]);

  const loadMembership = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userEmail = user?.email || null;
      if (!userEmail) {
        setMemberState(null);
        return;
      }

      const { data, error } = await supabase
        .from('wasel_plus_memberships')
        .select('*')
        .eq('user_email', userEmail)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Failed to load Wasel+ membership:', error);
        return;
      }

      setMemberState(data || null);
    } catch (error) {
      console.error('Membership load error:', error);
    }
  }, []);

  useEffect(() => {
    loadMembership();
  }, [loadMembership]);

  const saveMembershipRecord = useCallback(
    async ({ status, method, paypalDetails = null }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userEmail = user?.email || null;
      const userId = user?.id || null;

      if (!userEmail) {
        toast.error('يرجى تسجيل الدخول أولاً قبل الاشتراك في العضوية');
        return { ok: false };
      }

      const now = new Date();
      const endDate = addDays(now, plan.periodDays);
      const trialEnd = addDays(now, 30);
      const hasIntroFreeMonth = status === 'active' && method === 'paypal_subscription' && plan.key === 'monthly';

      const captureId =
        paypalDetails?.id ||
        paypalDetails?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
        null;

      const subscriptionCode = generateSubscriptionCode();

      const payload = {
        user_id: userId,
        user_email: userEmail,
        plan_type: plan.key,
        status,
        payment_method: method,
        price_usd: plan.priceUSD,
        start_date: status === 'active' ? now.toISOString() : null,
        end_date: status === 'active' ? endDate.toISOString() : null,
        trial_start: hasIntroFreeMonth ? now.toISOString() : null,
        trial_end: hasIntroFreeMonth ? trialEnd.toISOString() : null,
        paypal_capture_id: captureId,
        paypal_payload: paypalDetails,
        benefits_snapshot: MEMBERSHIP_BENEFITS,
        subscription_code: subscriptionCode,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('wasel_plus_memberships').upsert(payload, {
        onConflict: 'user_email',
      });

      if (error) {
        // Retry without subscription_code if column doesn't exist yet
        if (error.message?.includes('subscription_code') || error.code === '42703') {
          delete payload.subscription_code;
          const { error: retryError } = await supabase.from('wasel_plus_memberships').upsert(payload, {
            onConflict: 'user_email',
          });
          if (retryError) {
            console.error('Membership save failed:', retryError);
            toast.error('فشل حفظ الاشتراك. تأكد من إنشاء جدول العضوية في Supabase أولاً.');
            return { ok: false, error: retryError };
          }
        } else {
          console.error('Membership save failed:', error);
          toast.error('فشل حفظ الاشتراك. تأكد من إنشاء جدول العضوية في Supabase أولاً.');
          return { ok: false, error };
        }
      }

      localStorage.setItem('wasel_plus_member', 'true');
      await loadMembership();
      return { ok: true };
    },
    [loadMembership, plan.key, plan.periodDays, plan.priceUSD]
  );

  const handlePayPalSuccess = async (details) => {
    setSavingPayPal(true);
    try {
      const result = await saveMembershipRecord({
        status: 'active',
        method: 'paypal_subscription',
        paypalDetails: details,
      });

      if (result.ok) {
        toast.success('تم الاشتراك في Wasel+ بنجاح عبر PayPal');
      }
    } finally {
      setSavingPayPal(false);
    }
  };

  const handlePayPalError = (error) => {
    console.error('PayPal membership error:', error);
    toast.error('فشل الدفع عبر PayPal، حاول مرة أخرى');
  };

  const handleWhatsAppCheckout = async () => {
    setLoadingWhatsApp(true);
    try {
      const saveResult = await saveMembershipRecord({
        status: 'pending_whatsapp',
        method: 'whatsapp',
      });

      if (!saveResult.ok) {
        return;
      }

      const message = [
        '⭐ اشتراك Wasel+',
        `الخطة: ${plan.key === 'monthly' ? 'شهرية' : 'سنوية'}`,
        `المبلغ: $${plan.priceUSD}`,
        'أرغب بإكمال الاشتراك عبر واتساب.',
      ].join('\n');

      const whatsappUrl = `${WHATSAPP_BASE_LINK}?text=${encodeURIComponent(message)}`;
      const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      if (!opened) {
        window.location.href = whatsappUrl;
      }
      toast.success('تم تجهيز طلب الاشتراك عبر واتساب');
    } catch (error) {
      console.error('WhatsApp membership checkout failed:', error);
      toast.error('تعذر فتح رابط واتساب للاشتراك');
    } finally {
      setLoadingWhatsApp(false);
    }
  };

  const memberBadgeText = useMemo(() => {
    if (!memberState) return null;
    if (memberState.status === 'trialing') return 'أنت حالياً في الشهر التجريبي المجاني';
    if (memberState.status === 'active') return 'أنت مشترك الآن في عضوية Wasel+';
    if (memberState.status === 'pending_whatsapp') return 'طلب اشتراكك عبر واتساب قيد المعالجة';
    return null;
  }, [memberState]);

  const subscriptionCode = memberState?.subscription_code || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF7E0] via-[#FDFDFB] to-[#F3F6FA] pb-24 font-['Cairo']">
      <main className="max-w-3xl mx-auto px-4 py-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 md:p-8 text-white bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#3A506B] shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FFD166] text-[#1B1F3B] flex items-center justify-center">
              <SmartLottie
                animationPath={ANIMATION_PRESETS.premiumCrown.path}
                width={60}
                height={60}
                trigger="never"
                autoplay={true}
                loop={true}
                speed={0.8}
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold" dir="rtl">⭐ عضوية Wasel+</h1>
              <p className="text-white/85 text-sm" dir="rtl">وفر أكثر مع كل طلب وخصومات حصرية طوال الشهر</p>
            </div>
          </div>

          {memberBadgeText && (
            <div className="rounded-xl bg-white/15 border border-white/25 px-4 py-3 text-sm font-semibold" dir="rtl">
              {memberBadgeText}
            </div>
          )}

          {subscriptionCode && (
            <div className="rounded-xl bg-[#FFD166]/20 border border-[#FFD166]/40 px-4 py-3 mt-3" dir="rtl">
              <p className="text-xs text-white/80 mb-1">كود الاشتراك الخاص بك:</p>
              <p className="text-xl font-mono font-extrabold tracking-widest text-[#FFD166] select-all">{subscriptionCode}</p>
              <p className="text-xs text-white/60 mt-1">احتفظ بهذا الكود كمرجع لاشتراكك</p>
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl border border-[#E8ECF2] p-5 mt-5 shadow-sm"
        >
          <h2 className="text-lg font-bold text-[#1F2937] mb-3" dir="rtl">السعر</h2>

          <div className="grid md:grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`rounded-2xl border-2 p-4 text-right transition-all ${
                selectedPlan === 'monthly' ? 'border-[#0EA5E9] bg-[#E0F2FE]' : 'border-[#E5E7EB] bg-white'
              }`}
              dir="rtl"
            >
              <p className="font-extrabold text-[#111827]">10 دولار شهريًا</p>
              <p className="text-xs text-[#4B5563] mt-1">شهر تجريبي مجاني عند الاشتراك</p>
            </button>

            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`rounded-2xl border-2 p-4 text-right transition-all ${
                selectedPlan === 'yearly' ? 'border-[#0EA5E9] bg-[#E0F2FE]' : 'border-[#E5E7EB] bg-white'
              }`}
              dir="rtl"
            >
              <p className="font-extrabold text-[#111827]">100 دولار سنويًا</p>
              <p className="text-xs text-[#4B5563] mt-1">توفير 20%</p>
            </button>
          </div>

          <div className="mt-4 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] p-3 text-sm text-[#9A3412]" dir="rtl">
            <span className="font-bold">أول شهر مجاني تلقائيا عند الاشتراك عبر PayPal</span>
            <p className="text-xs mt-1">لن يتم خصم 10$ إلا من الشهر الثاني، ولا يوجد زر تفعيل منفصل.</p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-[#E8ECF2] p-5 mt-5 shadow-sm"
        >
          <h2 className="text-lg font-bold text-[#1F2937] mb-3" dir="rtl">مزايا العضوية</h2>
          <div className="space-y-2" dir="rtl">
            {MEMBERSHIP_BENEFITS.map((benefit) => (
              <div key={benefit} className="flex items-start gap-2 text-sm text-[#1F2937]">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <span>✔ {benefit}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl border border-[#E8ECF2] p-5 mt-5 shadow-sm"
        >
          <h2 className="text-lg font-bold text-[#1F2937] mb-3" dir="rtl">الدفع للاشتراك المباشر</h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {!insideSyria && (
              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`rounded-xl py-3 text-sm font-bold border-2 ${
                  paymentMethod === 'paypal' ? 'border-[#F59E0B] bg-[#FEF3C7] text-[#92400E]' : 'border-[#E5E7EB] text-[#374151]'
                }`}
              >
                PayPal
              </button>
            )}
            <button
              onClick={() => setPaymentMethod('whatsapp')}
              className={`rounded-xl py-3 text-sm font-bold border-2 ${
                paymentMethod === 'whatsapp' ? 'border-[#22C55E] bg-[#DCFCE7] text-[#166534]' : 'border-[#E5E7EB] text-[#374151]'
              }`}
            >
              WhatsApp
            </button>
          </div>

          {paymentMethod === 'paypal' && !insideSyria ? (
            <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-4">
              <div className="flex items-center justify-between mb-3" dir="rtl">
                <span className="text-sm text-[#78350F] font-bold">قيمة الاشتراك الآن</span>
                <span className="text-xl font-extrabold text-[#92400E]">${plan.priceUSD.toFixed(2)}</span>
              </div>
              {plan.key === 'monthly' && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800 mb-3" dir="rtl">
                  أول شهر مجاني تلقائيا. يبدأ الخصم الشهري (10$) من الشهر الثاني.
                </div>
              )}
              {!plan.planId ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800" dir="rtl">
                  لم يتم ضبط Plan ID لهذه الخطة بعد. أضف المتغير البيئي المناسب ثم أعد المحاولة.
                </div>
              ) : (
                <PayPalSubscriptionButton
                  planId={plan.planId}
                  onApprove={handlePayPalSuccess}
                  onError={handlePayPalError}
                />
              )}
              {savingPayPal && <p className="text-xs text-[#92400E] mt-2" dir="rtl">جاري تثبيت اشتراكك بعد الدفع...</p>}
            </div>
          ) : (
            <button
              onClick={handleWhatsAppCheckout}
              disabled={loadingWhatsApp}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#16A34A] text-white font-extrabold flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <MessageCircle className="w-5 h-5" />
              {loadingWhatsApp ? 'جاري التجهيز...' : 'إكمال الطلب عبر واتساب'}
            </button>
          )}
        </motion.section>

        <div className="mt-5 grid md:grid-cols-3 gap-3">
          <div className="rounded-2xl p-4 bg-white border border-[#E5E7EB] text-right" dir="rtl">
            <BadgeDollarSign className="w-5 h-5 text-[#0EA5E9] mb-2" />
            <p className="font-bold text-sm text-[#1F2937]">خصومات تلقائية</p>
            <p className="text-xs text-[#6B7280]">تطبق مباشرة عند الطلب</p>
          </div>
          <div className="rounded-2xl p-4 bg-white border border-[#E5E7EB] text-right" dir="rtl">
            <CalendarDays className="w-5 h-5 text-[#7C3AED] mb-2" />
            <p className="font-bold text-sm text-[#1F2937]">مرونة التسليم</p>
            <p className="text-xs text-[#6B7280]">تحديد اليوم والوقت بسهولة</p>
          </div>
          <div className="rounded-2xl p-4 bg-white border border-[#E5E7EB] text-right" dir="rtl">
            <Sparkles className="w-5 h-5 text-[#F59E0B] mb-2" />
            <p className="font-bold text-sm text-[#1F2937]">مفاجآت شهرية</p>
            <p className="text-xs text-[#6B7280]">كوبونات خاصة للأعضاء</p>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
