/**
 * مكون لحماية الطرق بناءً على الأدوار
 * Protected Route Component - يفرض الوصول بناءً على دور المستخدم
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { canAccessPage, getAccessDeniedMessage } from '@/utils/roleBasedAccess';
import { motion } from 'framer-motion';
import { Lock, AlertTriangle, LogIn } from 'lucide-react';
import { getCurrentAdminUser } from '@/utils/adminAuth';
import { createPageUrl } from '@/utils';

export default function ProtectedRoute({ pageName, children }) {
  const user = getCurrentAdminUser();
  const hasAccess = canAccessPage(pageName);
  const message = getAccessDeniedMessage(pageName);

  // 🔴 لا يملك صلاحية الوصول
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-6"
          >
            <div className="bg-red-100 p-6 rounded-full">
              <Lock className="w-12 h-12 text-red-600" />
            </div>
          </motion.div>

          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            ⚠️ تم رفض الوصول
          </h1>

          <p className="text-gray-600 mb-6 text-lg">
            {message}
          </p>

          {!user && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a
                href={createPageUrl('StaffLogin')}
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all"
              >
                <LogIn className="inline w-4 h-4 mr-2" />
                تسجيل الدخول
              </a>
            </motion.div>
          )}

          {user && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a
                href={createPageUrl('Home')}
                className="inline-block bg-gray-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-700 transition-all"
              >
                العودة للرئيسية
              </a>
            </motion.div>
          )}

          <p className="text-xs text-gray-400 mt-8">
            إذا كان لديك سؤال، يرجى التواصل مع الدعم الفني
          </p>
        </motion.div>
      </div>
    );
  }

  // ✅ يملك صلاحية الوصول
  return children;
}
