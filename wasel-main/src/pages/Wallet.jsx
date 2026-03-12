import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Wallet as WalletIcon, QrCode, Plus, ArrowDownLeft, ArrowUpRight,
  Camera, X, Loader2, MessageCircle, CreditCard, History,
  ChevronRight, DollarSign, RefreshCcw, CheckCircle, AlertCircle, ScanLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useUsdToSypRate } from '@/lib/exchangeRate';
import { createPageUrl } from '@/utils';
import PayPalPayment from '@/components/payment/PayPalPayment';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';

const EXCHANGE_RATE_FALLBACK = 150;
const WHATSAPP_NUMBER = '971502406519';

const TOPUP_AMOUNTS = [5, 10, 25, 50, 100];

export default function WalletPage() {
  const navigate = useNavigate();
  const exchangeRate = useUsdToSypRate() || EXCHANGE_RATE_FALLBACK;

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balanceUsd, setBalanceUsd] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState('');
  const [topupMethod, setTopupMethod] = useState('paypal');
  const [showScanner, setShowScanner] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
  }, []);

  // Load wallet data
  const loadWallet = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const userId = session.user.id;
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance_usd')
        .eq('user_id', userId)
        .maybeSingle();
      setBalanceUsd(wallet?.balance_usd || 0);

      const { data: txns } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      setTransactions(txns || []);
    } catch (err) {
      console.error('Wallet load error:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { loadWallet(); }, [loadWallet]);

  // QR Scanner
  const startScanner = useCallback(async () => {
    setShowScanner(true);
    setScannerReady(false);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      await new Promise(r => setTimeout(r, 300));

      if (!scannerRef.current) return;

      const scanner = new Html5Qrcode('wallet-qr-reader');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setScannedCode(decodedText);
        },
        () => {}
      );
      setScannerReady(true);
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('لم نتمكن من فتح الكاميرا.\nاذهب إلى إعدادات التطبيق > الأذونات > فعّل الكاميرا', { duration: 6000 });
      setShowScanner(false);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    try {
      if (html5QrCodeRef.current?.isScanning) {
        await html5QrCodeRef.current.stop();
      }
      html5QrCodeRef.current = null;
    } catch {}
    setShowScanner(false);
    setScannerReady(false);
  }, []);

  // Redeem gift card code
  const handleQrResult = useCallback(async (code) => {
    if (!code) return;
    toast.info(`جاري تفعيل الكود: ${code.trim()}`);
    try {
      const cardCode = code.trim();
      const userId = session?.user?.id;
      if (!userId) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      setRedeeming(true);
      const { data, error } = await supabase.rpc('redeem_gift_card', {
        p_card_code: cardCode,
        p_user_id: userId,
      });

      if (error) {
        toast.error(`خطأ: ${error.message || JSON.stringify(error)}`, { duration: 8000 });
        return;
      }

      if (data?.success) {
        setShowCoinAnimation(true);
        toast.success(`تم شحن ${data.amount}$ بنجاح! 🎉`, { duration: 5000 });
        setBalanceUsd(data.new_balance);
        loadWallet();
      } else {
        const errKey = data?.error || 'unknown';
        const errMsg = errKey === 'card_not_found'
          ? `البطاقة غير موجودة`
          : errKey === 'card_already_used'
          ? 'هذه البطاقة مستخدمة مسبقاً'
          : `خطأ في تفعيل البطاقة`;
        toast.error(errMsg, { duration: 6000 });
      }
    } catch (err) {
      toast.error(`حدث خطأ: ${err?.message || 'unknown'}`, { duration: 8000 });
    } finally {
      setRedeeming(false);
    }
  }, [session, loadWallet]);

  // When QR scanner detects a code, stop scanner then redeem
  useEffect(() => {
    if (!scannedCode) return;
    stopScanner();
    handleQrResult(scannedCode);
    setScannedCode(null);
  }, [scannedCode, stopScanner, handleQrResult]);

  // Top-up via WhatsApp
  const handleWhatsAppTopup = useCallback(() => {
    const amount = customAmount ? Number(customAmount) : topupAmount;
    if (!amount || amount <= 0) {
      toast.error('أدخل مبلغاً صحيحاً');
      return;
    }
    const msg = encodeURIComponent(
      `مرحباً، أريد شحن محفظتي في تطبيق واصل بمبلغ ${amount}$ (${Math.round(amount * exchangeRate).toLocaleString()} ل.س)\n` +
      `البريد: ${session?.user?.email || '-'}\n` +
      `معرف المستخدم: ${session?.user?.id || '-'}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
    toast.info('تم فتح واتساب - أكمل عملية الشحن مع الفريق');
    setShowTopup(false);
  }, [topupAmount, customAmount, exchangeRate, session]);

  // Manual code entry
  const [manualCode, setManualCode] = useState('');
  const handleManualRedeem = useCallback(async () => {
    if (!manualCode.trim()) {
      toast.error('أدخل كود البطاقة');
      return;
    }
    await handleQrResult(manualCode.trim());
    setManualCode('');
  }, [manualCode, handleQrResult]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  // Auto-hide coin animation after 3 seconds
  useEffect(() => {
    if (!showCoinAnimation) return;
    const timer = setTimeout(() => {
      setShowCoinAnimation(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [showCoinAnimation]);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F7FAF9] flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <WalletIcon className="w-16 h-16 text-[#1B4332] mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-800 mb-2">محفظة واصل</h2>
          <p className="text-gray-500 mb-6">سجّل دخولك لاستخدام المحفظة</p>
          <Button onClick={() => navigate(createPageUrl('Home'))} className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl h-12">
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  const balanceSyp = Math.round(balanceUsd * exchangeRate);
  const finalTopupAmount = customAmount ? Number(customAmount) : topupAmount;

  return (
    <div className="min-h-screen bg-[#F7FAF9] pb-28 font-['Cairo']" dir="rtl">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] pt-8 pb-16 px-4 rounded-b-[2.5rem]">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-black text-white">محفظة واصل</h1>
            <Button variant="ghost" onClick={loadWallet} className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl">
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/15 backdrop-blur-md rounded-3xl p-6 border border-white/20 relative overflow-hidden"
          >
            <p className="text-white/70 text-sm mb-1">رصيدك الحالي</p>
            {loading ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <>
                <p className="text-4xl font-black text-white mb-1">{Number(balanceUsd).toFixed(2)}<span className="text-lg mr-1">$</span></p>
                <p className="text-white/60 text-sm">{balanceSyp.toLocaleString('en-US')} ل.س</p>
              </>
            )}
            
            {/* Coins Drop Animation on Wallet Top-up */}
            <AnimatePresence>
              {showCoinAnimation && (
                <div className="absolute top-2 right-2">
                  <SmartLottie
                    animationPath={ANIMATION_PRESETS.walletAddMoney.path}
                    width={120}
                    height={120}
                    trigger="never"
                    autoplay={true}
                    loop={false}
                    hideWhenDone={true}
                  />
                </div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <button
              onClick={() => setShowTopup(true)}
              className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center hover:bg-white/25 transition"
            >
              <Plus className="w-6 h-6 text-white mx-auto mb-1" />
              <p className="text-[11px] text-white/90 font-medium">شحن رصيد</p>
            </button>
            <button
              onClick={startScanner}
              className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center hover:bg-white/25 transition"
            >
              <QrCode className="w-6 h-6 text-white mx-auto mb-1" />
              <p className="text-[11px] text-white/90 font-medium">مسح بطاقة</p>
            </button>
            <button
              onClick={() => setShowTransactions(!showTransactions)}
              className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center hover:bg-white/25 transition"
            >
              <History className="w-6 h-6 text-white mx-auto mb-1" />
              <p className="text-[11px] text-white/90 font-medium">السجل</p>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {/* DIRECT PAYMENT SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-2xl p-5 shadow-lg border border-[#1B4332]"
        >
          <h3 className="font-black text-white mb-1 text-lg">الدفع المباشر</h3>
          <p className="text-white/70 text-xs mb-4">ادفع الآن عبر PayPal أو بطاقة بنكية</p>
          
          {/* Quick Amount Buttons - like Cart */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => {
                setTopupAmount(10);
                setTopupMethod('paypal');
              }}
              className="bg-white/15 backdrop-blur-sm hover:bg-white/25 border border-white/30 rounded-2xl p-4 text-center transition-all group"
            >
              <div className="text-2xl font-black text-white mb-1 group-hover:scale-110 transition">10<span className="text-sm">$</span></div>
              <p className="text-white/80 text-xs font-medium">دفع مباشر</p>
            </button>
            <button
              onClick={() => {
                setTopupAmount(100);
                setTopupMethod('paypal');
              }}
              className="bg-white/15 backdrop-blur-sm hover:bg-white/25 border border-white/30 rounded-2xl p-4 text-center transition-all group"
            >
              <div className="text-2xl font-black text-white mb-1 group-hover:scale-110 transition">100<span className="text-sm">$</span></div>
              <p className="text-white/80 text-xs font-medium">دفع مباشر</p>
            </button>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => {
                setTopupAmount(10);
                setTopupMethod('paypal');
              }}
              className={`p-3 rounded-xl border-2 transition-all text-center ${
                topupMethod === 'paypal'
                  ? 'border-white bg-white/10'
                  : 'border-white/20 hover:border-white/30'
              }`}
            >
              <CreditCard className={`w-5 h-5 mx-auto mb-1 ${topupMethod === 'paypal' ? 'text-white' : 'text-white/60'}`} />
              <p className={`text-xs font-bold ${topupMethod === 'paypal' ? 'text-white' : 'text-white/70'}`}>PayPal</p>
            </button>
            <button
              onClick={() => {
                setTopupAmount(10);
                setTopupMethod('whatsapp');
              }}
              className={`p-3 rounded-xl border-2 transition-all text-center ${
                topupMethod === 'whatsapp'
                  ? 'border-white bg-white/10'
                  : 'border-white/20 hover:border-white/30'
              }`}
            >
              <MessageCircle className={`w-5 h-5 mx-auto mb-1 ${topupMethod === 'whatsapp' ? 'text-white' : 'text-white/60'}`} />
              <p className={`text-xs font-bold ${topupMethod === 'whatsapp' ? 'text-white' : 'text-white/70'}`}>بطاقة البنك</p>
            </button>
          </div>

          {/* Custom Amount Input */}
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="أو أدخل مبلغاً مخصصاً ($)"
            className="w-full rounded-xl border border-white/30 bg-white/10 p-3 text-sm text-white placeholder-white/50 text-center mb-3"
            min="1"
            dir="ltr"
          />
          {(customAmount || topupAmount) > 0 && (
            <p className="text-xs text-white/60 text-center mb-3">
              ≈ {Math.round((customAmount ? Number(customAmount) : topupAmount) * exchangeRate).toLocaleString('en-US')} ل.س
            </p>
          )}

          {/* Payment Button */}
          {topupMethod === 'paypal' ? (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-3">
              <PayPalPayment
                amount={`${(customAmount ? Number(customAmount) : topupAmount).toFixed(2)}`}
                onSuccess={async (details) => {
                  if (!session?.user?.id) {
                    toast.error('Session error, please login again.');
                    return;
                  }
                  try {
                    setShowCoinAnimation(true);
                    const { data, error } = await supabase.rpc('wallet_topup', {
                      p_user_id: session.user.id,
                      p_amount_usd: customAmount ? Number(customAmount) : topupAmount,
                      p_source: 'paypal_direct'
                    });
                    if (error) throw error;
                    toast.success(`تم شحن ${customAmount ? Number(customAmount) : topupAmount}$ عبر PayPal بنجاح! 🎉`);
                    loadWallet();
                  } catch (err) {
                    console.error('PayPal topup error:', err);
                    toast.error('حدثت مشكلة أثناء تحديث الرصيد');
                  }
                }}
                onError={(err) => {
                  console.error('PayPal error:', err);
                  toast.error('فشل الدفع عبر PayPal');
                }}
              />
            </div>
          ) : (
            <Button
              onClick={handleWhatsAppTopup}
              className="w-full h-12 rounded-xl bg-white text-[#1B4332] hover:bg-white/90 font-bold text-base"
            >
              <MessageCircle className="w-5 h-5 ml-2" />
              أرسل ملخص الدفع عبر WhatsApp
            </Button>
          )}
        </motion.div>

        {/* Manual Code Entry */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E7EB]"
        >
          <div className="flex items-center gap-2 mb-3">
            <ScanLine className="w-5 h-5 text-[#1B4332]" />
            <h3 className="font-bold text-[#0F172A]">تفعيل بطاقة هدية</h3>
          </div>
          <p className="text-xs text-[#64748B] mb-3">أدخل كود البطاقة أو امسح رمز QR</p>
          <div className="flex gap-2">
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="أدخل كود البطاقة مثل CARD-XXXX"
              className="flex-1 rounded-xl border border-[#E5E7EB] bg-[#FAFCFB] p-3 text-sm font-mono text-center tracking-wider"
              dir="ltr"
            />
            <Button
              onClick={handleManualRedeem}
              disabled={redeeming || !manualCode.trim()}
              className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl px-4"
            >
              {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            </Button>
          </div>
          <button
            onClick={startScanner}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#059669] to-[#10B981] text-white rounded-xl py-3 font-bold text-sm hover:opacity-90 transition"
          >
            <Camera className="w-5 h-5" />
            فتح الكاميرا ومسح QR
          </button>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] rounded-2xl p-5 border border-[#BBF7D0]"
        >
          <h3 className="font-bold text-[#166534] mb-3">كيف تعمل بطاقات واصل؟</h3>
          <div className="space-y-2">
            {[
              { step: '1', text: 'اشترِ بطاقة واصل من أي محل معتمد' },
              { step: '2', text: 'امسح رمز QR أو أدخل الكود يدوياً' },
              { step: '3', text: 'يتم إضافة الرصيد فوراً لمحفظتك' },
              { step: '4', text: 'ادفع طلباتك مباشرة من المحفظة' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#166534] text-white flex items-center justify-center text-xs font-black shrink-0">{item.step}</div>
                <p className="text-sm text-[#15803D]">{item.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Transactions */}
        {showTransactions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E7EB]"
          >
            <h3 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2">
              <History className="w-5 h-5 text-[#64748B]" />
              سجل العمليات
            </h3>
            {transactions.length === 0 ? (
              <p className="text-sm text-[#94A3B8] text-center py-4">لا توجد عمليات بعد</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        Number(tx.amount_usd) > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {Number(tx.amount_usd) > 0
                          ? <ArrowDownLeft className="w-4 h-4 text-green-600" />
                          : <ArrowUpRight className="w-4 h-4 text-red-600" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">{tx.description || tx.type}</p>
                        <p className="text-[10px] text-[#94A3B8]">{new Date(tx.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <p className={`font-black text-sm ${Number(tx.amount_usd) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Number(tx.amount_usd) > 0 ? '+' : ''}{Number(tx.amount_usd).toFixed(2)}$
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Top-up Modal */}
      <AnimatePresence>
        {showTopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowTopup(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-[#0F172A]">شحن المحفظة</h3>
                <button onClick={() => setShowTopup(false)} className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                  <X className="w-4 h-4 text-[#64748B]" />
                </button>
              </div>

              {/* Amount Selection */}
              <p className="text-sm text-[#64748B] mb-3">اختر المبلغ</p>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {TOPUP_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => { setTopupAmount(amt); setCustomAmount(''); }}
                    className={`rounded-xl py-3 text-center font-bold text-sm transition-all ${
                      !customAmount && topupAmount === amt
                        ? 'bg-[#1B4332] text-white shadow-md'
                        : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
                    }`}
                  >
                    {amt}$
                  </button>
                ))}
              </div>
              <div className="mb-4">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="أو أدخل مبلغاً مخصصاً ($)"
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFCFB] p-3 text-sm text-center"
                  min="1"
                  dir="ltr"
                />
                {finalTopupAmount > 0 && (
                  <p className="text-xs text-[#64748B] mt-1 text-center">
                    ≈ {Math.round(finalTopupAmount * exchangeRate).toLocaleString('en-US')} ل.س
                  </p>
                )}
              </div>

              {/* Method Selection */}
              <p className="text-sm text-[#64748B] mb-3">طريقة الشحن</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  onClick={() => setTopupMethod('paypal')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    topupMethod === 'paypal'
                      ? 'border-[#003087] bg-[#003087]/5'
                      : 'border-[#E5E7EB] hover:border-[#CBD5E1]'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 mx-auto mb-1 ${topupMethod === 'paypal' ? 'text-[#003087]' : 'text-[#94A3B8]'}`} />
                  <p className={`text-sm font-bold ${topupMethod === 'paypal' ? 'text-[#003087]' : 'text-[#64748B]'}`}>PayPal</p>
                </button>
                <button
                  onClick={() => setTopupMethod('whatsapp')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    topupMethod === 'whatsapp'
                      ? 'border-[#25D366] bg-[#25D366]/5'
                      : 'border-[#E5E7EB] hover:border-[#CBD5E1]'
                  }`}
                >
                  <MessageCircle className={`w-5 h-5 mx-auto mb-1 ${topupMethod === 'whatsapp' ? 'text-[#25D366]' : 'text-[#94A3B8]'}`} />
                  <p className={`text-sm font-bold ${topupMethod === 'whatsapp' ? 'text-[#25D366]' : 'text-[#64748B]'}`}>واتساب</p>
                </button>
              </div>

              {topupMethod === 'whatsapp' ? (
                <Button
                  onClick={handleWhatsAppTopup}
                  disabled={!finalTopupAmount || finalTopupAmount <= 0}
                  className="w-full h-12 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-base"
                >
                  <MessageCircle className="w-5 h-5 ml-2" />إكمال الشحن عبر واتساب
                </Button>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mt-2 shadow-sm">
                  <PayPalPayment
                    amount={finalTopupAmount > 0 ? Number(finalTopupAmount).toFixed(2) : '0.00'}
                    onSuccess={async (details) => {
                      if (!session?.user?.id) {
                        toast.error('Session error, please login again.');
                        return;
                      }
                      try {
                        const { data, error } = await supabase.rpc('wallet_topup', {
                          p_user_id: session.user.id,
                          p_amount_usd: finalTopupAmount,
                          p_source: 'paypal'
                        });
                        if (error) throw error;
                        setShowTopup(false);
                        toast.success(`تم شحن ${finalTopupAmount}$ عبر PayPal بنجاح! 🎉`);
                        loadWallet();
                      } catch (err) {
                        console.error('PayPal topup error:', err);
                        toast.error('حدثت مشكلة أثناء تحديث الرصيد، يرجى مراسلة الدعم');
                      }
                    }}
                    onError={(err) => {
                      console.error('PayPal error:', err);
                      toast.error('فشل الدفع عبر PayPal');
                    }}
                  />
                </div>
              )}
              <p className="text-[10px] text-[#94A3B8] text-center mt-2">سيتم إضافة الرصيد بعد تأكيد الدفع</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4">
              <h3 className="text-white font-bold text-lg">مسح بطاقة واصل</h3>
              <button onClick={stopScanner} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center px-4">
              <div className="w-full max-w-sm">
                <div
                  id="wallet-qr-reader"
                  ref={scannerRef}
                  className="w-full rounded-2xl overflow-hidden"
                />
                {!scannerReady && (
                  <div className="flex flex-col items-center justify-center h-64 text-white">
                    <Loader2 className="w-10 h-10 animate-spin mb-3" />
                    <p className="text-sm">جارٍ تشغيل الكاميرا...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 text-center">
              <p className="text-white/70 text-sm mb-2">وجّه الكاميرا نحو رمز QR على البطاقة</p>
              {redeeming && (
                <div className="flex items-center justify-center gap-2 text-[#6EE7B7]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <p className="text-sm font-bold">جارٍ تفعيل البطاقة...</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
