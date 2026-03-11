import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const DEFAULT_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

const PAYPAL_NAMESPACE = 'paypal_subscribe';

function getSdkUrl(clientId) {
  const merchantId = import.meta.env.VITE_PAYPAL_MERCHANT_ID || 'joudjr30@gmail.com';
  const params = new URLSearchParams({
    'client-id': clientId,
    'merchant-id': merchantId,
    vault: 'true',
    intent: 'subscription',
    currency: 'USD',
    components: 'buttons',
  });

  return `https://www.paypal.com/sdk/js?${params.toString()}`;
}

export default function PayPalSubscriptionButton({ planId, onApprove, onError }) {
  const paypalContainerRef = useRef(null);
  const cardContainerRef = useRef(null);

  const directSubscribeUrl = `https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${encodeURIComponent(planId || '')}`;

  useEffect(() => {
    let mounted = true;
    let pollId = null;

    if (!planId) {
      toast.error('Missing PayPal subscription plan id');
      return undefined;
    }

    if (!DEFAULT_CLIENT_ID) {
      toast.error('PayPal Client ID is missing. Add VITE_PAYPAL_CLIENT_ID to .env');
      onError?.(new Error('PayPal Client ID is missing'));
      return undefined;
    }

    const renderButtons = async () => {
      const paypalSdk = window[PAYPAL_NAMESPACE];
      if (!mounted || !paypalSdk?.Buttons) return;

      if (paypalContainerRef.current) {
        paypalContainerRef.current.innerHTML = '';
      }
      if (cardContainerRef.current) {
        cardContainerRef.current.innerHTML = '';
      }

      const baseConfig = {
        createSubscription(data, actions) {
          return actions.subscription.create({
            plan_id: planId,
          });
        },
        onApprove(data) {
          toast.success('تم تفعيل الاشتراك عبر PayPal بنجاح');
          onApprove?.(data);
        },
        onError(error) {
          console.error('PayPal subscription error:', error);
          toast.error('فشل تفعيل الاشتراك عبر PayPal');
          onError?.(error);
        },
        onCancel() {
          toast.info('تم إلغاء عملية الاشتراك');
        },
      };

      const paypalButton = paypalSdk.Buttons({
        ...baseConfig,
        fundingSource: paypalSdk.FUNDING.PAYPAL,
        style: {
          shape: 'pill',
          color: 'gold',
          layout: 'vertical',
          label: 'subscribe',
          height: 45,
        },
      });

      if (paypalButton?.isEligible?.() && paypalContainerRef.current) {
        await paypalButton.render(paypalContainerRef.current);
      }

      const cardButton = paypalSdk.Buttons({
        ...baseConfig,
        fundingSource: paypalSdk.FUNDING.CARD,
        style: {
          shape: 'pill',
          color: 'black',
          layout: 'vertical',
          label: 'subscribe',
          height: 45,
        },
      });

      if (cardButton?.isEligible?.() && cardContainerRef.current) {
        await cardButton.render(cardContainerRef.current);
      }
    };

    const loadSdk = async () => {
      if (window[PAYPAL_NAMESPACE]?.Buttons) {
        renderButtons();
        return;
      }

      const scriptId = `paypal-sdk-${PAYPAL_NAMESPACE}`;
      let script = document.getElementById(scriptId);

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = getSdkUrl(DEFAULT_CLIENT_ID);
        script.setAttribute('data-namespace', PAYPAL_NAMESPACE);
        script.setAttribute('data-sdk-integration-source', 'button-factory');
        script.async = true;
        document.body.appendChild(script);
      }

      if (window[PAYPAL_NAMESPACE]?.Buttons) {
        renderButtons();
        return;
      }

      script.addEventListener('load', renderButtons, { once: true });
      script.addEventListener(
        'error',
        () => {
          toast.error('فشل تحميل PayPal SDK للاشتراكات');
          onError?.(new Error('Failed to load PayPal Subscription SDK'));
        },
        { once: true }
      );

      // Fallback polling for cases where load event was already fired before listener attachment
      pollId = window.setInterval(() => {
        if (!mounted) return;
        if (window[PAYPAL_NAMESPACE]?.Buttons) {
          clearInterval(pollId);
          renderButtons();
        }
      }, 250);

      window.setTimeout(() => {
        if (pollId) {
          clearInterval(pollId);
          pollId = null;
        }
      }, 8000);
    };

    loadSdk();

    return () => {
      mounted = false;
      if (pollId) {
        clearInterval(pollId);
      }
    };
  }, [onApprove, onError, planId]);

  return (
    <div className="w-full space-y-2">
      <div ref={paypalContainerRef} className="w-full max-w-[360px] min-h-[50px] mx-auto" />
      <div ref={cardContainerRef} className="w-full max-w-[360px] min-h-[50px] mx-auto" />
      <div className="w-full max-w-[360px] mx-auto grid grid-cols-1 gap-2">
        <a
          href={directSubscribeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm font-bold rounded-full px-4 py-2 bg-[#FFC439] text-[#111827]"
        >
          بديل مباشر PayPal (أصفر)
        </a>
        <a
          href={directSubscribeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm font-bold rounded-full px-4 py-2 bg-[#111827] text-white"
        >
          بديل مباشر بطاقة (أسود)
        </a>
      </div>
      <a
        href={directSubscribeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full max-w-[360px] mx-auto text-center text-xs text-[#1D4ED8] hover:underline"
      >
        إذا لم يظهر الزر، اضغط هنا لإكمال الاشتراك مباشرة عبر PayPal
      </a>
    </div>
  );
}
