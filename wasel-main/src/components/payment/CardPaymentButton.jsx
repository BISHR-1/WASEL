import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import CardPaymentForm from './CardPaymentForm';

export default function CardPaymentButton({ amount, onSuccess, onError }) {
    const [showForm, setShowForm] = useState(false);

    const handleCardPayment = () => {
        console.log('🟣 Opening card payment form, amount:', amount);
        setShowForm(true);
    };

    const handleFormSuccess = (data) => {
        console.log('✅ Card payment successful:', data);
        setShowForm(false);
        onSuccess?.(data);
    };

    const handleFormError = (error) => {
        console.error('❌ Card payment error:', error);
        // Keep form open so user can try again
        onError?.(error);
    };

    const handleFormCancel = () => {
        console.log('ℹ️ Card payment cancelled');
        setShowForm(false);
    };

    return (
        <>
            <button
                onClick={handleCardPayment}
                className="w-full bg-[#000000] hover:bg-[#2C2E2F] text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
            >
                <CreditCard className="w-5 h-5" />
                <span>الدفع ببطاقة الائتمان أو الخصم</span>
            </button>

            {/* Card Payment Form Modal */}
            {showForm && (
                <CardPaymentForm
                    amount={amount}
                    onSuccess={handleFormSuccess}
                    onError={handleFormError}
                    onCancel={handleFormCancel}
                />
            )}
        </>
    );
}
