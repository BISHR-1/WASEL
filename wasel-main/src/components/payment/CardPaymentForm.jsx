import React, { useEffect, useState, useRef } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Fixed: Using Supabase functions with proper mobile support
// The 'create-paypal-payment' function now includes fallback for null origin headers from mobile
const API_BASE = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

export default function CardPaymentForm({ amount, onSuccess, onError, onCancel }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const hostedFieldsInstance = useRef(null);
    const [orderId, setOrderId] = useState(null);

    useEffect(() => {
        loadPayPalHostedFields();
    }, []);

    const loadPayPalHostedFields = async () => {
        try {
            console.log('🟣 Loading PayPal Hosted Fields...');
            
            // Check if script already loaded
            if (window.paypal && window.paypal.HostedFields) {
                console.log('✅ PayPal SDK already loaded');
                initializeHostedFields();
                return;
            }

            // Load PayPal SDK with Hosted Fields component
            const script = document.createElement('script');
            const merchantId = import.meta.env.VITE_PAYPAL_MERCHANT_ID || 'joudjr30@gmail.com';
            script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&merchant-id=${merchantId}&components=hosted-fields&currency=USD`;
            script.async = true;
            
            script.onload = () => {
                console.log('✅ PayPal SDK loaded successfully');
                initializeHostedFields();
            };
            
            script.onerror = () => {
                console.error('❌ Failed to load PayPal SDK');
                setError('فشل تحميل نموذج الدفع');
                setIsLoading(false);
            };
            
            document.body.appendChild(script);
        } catch (err) {
            console.error('❌ Error loading PayPal:', err);
            setError('حدث خطأ في تحميل نموذج الدفع');
            setIsLoading(false);
        }
    };

    const initializeHostedFields = async () => {
        try {
            console.log('🟣 Creating PayPal order...');
            
            // Create order first
            const createResponse = await fetch(`${API_BASE}/create-paypal-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ANON_KEY}`,
                    'apikey': ANON_KEY
                },
                body: JSON.stringify({
                    action: 'create',
                    amount: amount.toString()
                })
            });

            if (!createResponse.ok) {
                throw new Error(`HTTP error! status: ${createResponse.status}`);
            }

            const orderData = await createResponse.json();
            console.log('✅ Order created:', orderData);
            
            // Handle response - PayPal returns 'id' field for the order ID
            const orderID = orderData.id || orderData.orderId || orderData.order_id;
            if (!orderID) {
                console.error('❌ No order ID in response:', orderData);
                throw new Error('فشل في إنشاء الطلب: لم نتلقَ معرف الطلب');
            }
            setOrderId(orderID);

            // Check if HostedFields is available
            if (!window.paypal || !window.paypal.HostedFields) {
                console.error('❌ PayPal Hosted Fields not available');
                throw new Error('PayPal Hosted Fields غير متاح');
            }

            // Note: isEligible() check is removed because it can fail in some Live configurations
            // The actual eligibility will be determined by PayPal during the render call
            console.log('🟣 Initializing Hosted Fields...');
            console.log('ℹ️ HostedFields availability check:', {
                hasHostedFields: !!window.paypal.HostedFields,
                isEligibleCheck: typeof window.paypal.HostedFields.isEligible === 'function' ? 
                  'available' : 'not available'
            });
            
            // Initialize Hosted Fields
            const hostedFields = await window.paypal.HostedFields.render({
                createOrder: () => orderID,
                styles: {
                    'input': {
                        'font-size': '16px',
                        'font-family': 'Arial, sans-serif',
                        'color': '#000000'
                    },
                    '.invalid': {
                        'color': '#dc2626'
                    },
                    '.valid': {
                        'color': '#16a34a'
                    }
                },
                fields: {
                    number: {
                        selector: '#card-number',
                        placeholder: 'رقم البطاقة'
                    },
                    cvv: {
                        selector: '#cvv',
                        placeholder: 'CVV'
                    },
                    expirationDate: {
                        selector: '#expiration-date',
                        placeholder: 'MM/YY'
                    }
                }
            });

            hostedFieldsInstance.current = hostedFields;
            setIsLoading(false);
            console.log('✅ Hosted Fields initialized successfully');

        } catch (err) {
            console.error('❌ Hosted Fields initialization error:', err);
            
            // Provide more specific error messages
            if (err.message.includes('not eligible')) {
                setError('حسابك PayPal لم يكن مفعلاً بعد للدفع. تأكد من تفعيل Live Account على PayPal');
            } else if (err.message.includes('Hosted Fields')) {
                setError('فشل تحميل نموذج الدفع الآمن. تحقق من إعدادات PayPal');
            } else {
                setError('فشل تهيئة نموذج الدفع: ' + err.message);
            }
            
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!hostedFieldsInstance.current) {
            console.error('❌ Hosted Fields not initialized');
            setError('نموذج الدفع غير جاهز');
            return;
        }

        const cardholderName = document.getElementById('cardholder-name')?.value;
        if (!cardholderName || cardholderName.trim() === '') {
            setError('يرجى إدخال اسم حامل البطاقة');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            console.log('🟣 Submitting card data...');
            
            // Submit the card details
            const submitResult = await hostedFieldsInstance.current.submit({
                cardholderName: cardholderName.trim()
            });

            console.log('✅ Card submitted successfully:', submitResult);
            
            const submittedOrderId = submitResult.orderId;
            if (!submittedOrderId) {
                console.error('❌ No order ID returned from submit:', submitResult);
                throw new Error('فشل في معالجة البطاقة');
            }

            // Capture the payment
            console.log('🟣 Capturing payment for order:', submittedOrderId);
            const captureResponse = await fetch(`${API_BASE}/create-paypal-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ANON_KEY}`,
                    'apikey': ANON_KEY
                },
                body: JSON.stringify({
                    action: 'capture',
                    orderId: submittedOrderId
                })
            });

            if (!captureResponse.ok) {
                const errorData = await captureResponse.text();
                console.error('❌ Capture response error:', errorData);
                throw new Error(`فشل الدفع: ${captureResponse.status}`);
            }

            const captureData = await captureResponse.json();
            console.log('✅ Payment captured successfully:', captureData);
            console.log('Calling onSuccess callback with data:', captureData);

            // Call success callback - this is critical
            if (onSuccess && typeof onSuccess === 'function') {
                try {
                    onSuccess(captureData);
                    console.log('✅ onSuccess callback called successfully');
                } catch (callbackErr) {
                    console.error('❌ Error in onSuccess callback:', callbackErr);
                }
            } else {
                console.error('❌ onSuccess callback not available or not a function');
            }

        } catch (err) {
            console.error('❌ Payment error:', err.message);
            setError(err.message || 'فشل الدفع، يرجى المحاولة مرة أخرى');
            setIsProcessing(false);
            
            console.log('Calling onError callback with error:', err);
            if (onError && typeof onError === 'function') {
                try {
                    onError(err);
                    console.log('✅ onError callback called successfully');
                } catch (callbackErr) {
                    console.error('❌ Error in onError callback:', callbackErr);
                }
            } else {
                console.error('❌ onError callback not available');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold">الدفع ببطاقة الائتمان</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={isProcessing}
                    >
                        ✕
                    </button>
                </div>

                {/* Amount */}
                <div className="mb-6 p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600">المبلغ الإجمالي</p>
                    <p className="text-2xl font-bold text-blue-600">${amount}</p>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-600">جاري تحميل نموذج الدفع...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Cardholder Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                اسم حامل البطاقة
                            </label>
                            <input
                                id="cardholder-name"
                                type="text"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="الاسم كما يظهر على البطاقة"
                                disabled={isProcessing}
                            />
                        </div>

                        {/* Card Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                رقم البطاقة
                            </label>
                            <div
                                id="card-number"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent"
                            ></div>
                        </div>

                        {/* Expiration Date & CVV */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    تاريخ الانتهاء
                                </label>
                                <div
                                    id="expiration-date"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent"
                                ></div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    CVV
                                </label>
                                <div
                                    id="cvv"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent"
                                ></div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>جاري المعالجة...</span>
                                </>
                            ) : (
                                <>
                                    <span>ادفع ${amount}</span>
                                </>
                            )}
                        </button>

                        {/* PayPal Logo */}
                        <div className="text-center pt-4">
                            <p className="text-xs text-gray-500">
                                آمن ومحمي بواسطة PayPal
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
