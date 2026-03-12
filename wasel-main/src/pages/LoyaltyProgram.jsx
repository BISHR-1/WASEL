import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '@/api/waselClient';

import { motion } from 'framer-motion';
import { Wallet, Gift, ArrowRight, History, Award, Star, Share2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from '../components/common/LanguageContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function LoyaltyProgram() {
  const { t, language } = useLanguage();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoyalty = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser) {
          const txs = await base44.entities.LoyaltyTransaction.list({
             filter: { user_email: currentUser.email },
             sort: { created_date: -1 }
          });
          setTransactions(txs);
          const total = txs.reduce((acc, tx) => acc + tx.points, 0);
          setBalance(total);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoyalty();
  }, []);

  const tiers = [
    { name: 'Bronze', min: 0, color: 'bg-orange-100 text-orange-800' },
    { name: 'Silver', min: 1000, color: 'bg-slate-100 text-slate-800' },
    { name: 'Gold', min: 5000, color: 'bg-yellow-100 text-yellow-800' },
  ];

  const currentTier = tiers.reverse().find(t => balance >= t.min) || tiers[tiers.length - 1];
  const nextTier = tiers.find(t => t.min > balance);
  const progress = nextTier ? ((balance - (tiers.find(t => t.name === currentTier.name)?.min || 0)) / (nextTier.min - (tiers.find(t => t.name === currentTier.name)?.min || 0))) * 100 : 100;

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-white py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-[#1B4332]">{language === 'ar' ? 'برنامج ولاء واصل' : 'Wasel Loyalty Program'}</h1>
          <p className="text-xl text-gray-600">{language === 'ar' ? 'اجمع النقاط واستبدلها بمكافآت حصرية' : 'Collect points and redeem exclusive rewards'}</p>
        </div>

        {!user ? (
          <Card className="text-center p-8 bg-white/80 backdrop-blur">
            <CardContent className="space-y-4">
              <Gift className="w-16 h-16 mx-auto text-[#52B788]" />
              <h2 className="text-2xl font-bold">{language === 'ar' ? 'سجل دخولك لتبدأ بجمع النقاط' : 'Login to start collecting points'}</h2>
              <Button onClick={() => base44.auth.redirectToLogin()} className="bg-[#1B4332] text-white">
                {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Balance Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white border-none shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-white/80 mb-1">{language === 'ar' ? 'رصيد نقاطك' : 'Your Points Balance'}</p>
                      <h2 className="text-5xl font-bold">{balance.toLocaleString()}</h2>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-bold ${currentTier.color}`}>
                      {currentTier.name} Member
                    </div>
                  </div>
                  
                  {nextTier && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-white/80">
                        <span>{language === 'ar' ? `المستوى الحالي: ${currentTier.name}` : `Current: ${currentTier.name}`}</span>
                        <span>{language === 'ar' ? `${nextTier.min - balance} نقطة للوصول إلى ${nextTier.name}` : `${nextTier.min - balance} to ${nextTier.name}`}</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-white/20" indicatorClassName="bg-[#52B788]" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
               <Card className="hover:shadow-lg transition cursor-pointer" onClick={() => {
                  navigator.clipboard.writeText(`WASEL-${user.id.substring(0,6)}`);
                  alert(language === 'ar' ? 'تم نسخ كود الدعوة' : 'Referral code copied');
               }}>
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                     <Share2 className="w-8 h-8 text-blue-500" />
                     <h3 className="font-bold">{language === 'ar' ? 'دعوة صديق' : 'Refer a Friend'}</h3>
                     <p className="text-xs text-gray-500">{language === 'ar' ? 'احصل على 500 نقطة لكل دعوة' : 'Get 500 points per referral'}</p>
                  </CardContent>
               </Card>
               <Card className="hover:shadow-lg transition">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                     <Star className="w-8 h-8 text-yellow-500" />
                     <h3 className="font-bold">{language === 'ar' ? 'استبدال النقاط' : 'Redeem Points'}</h3>
                     <p className="text-xs text-gray-500">{language === 'ar' ? 'استخدم النقاط عند الدفع' : 'Use points at checkout'}</p>
                  </CardContent>
               </Card>
               <Card className="hover:shadow-lg transition">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                     <History className="w-8 h-8 text-purple-500" />
                     <h3 className="font-bold">{language === 'ar' ? 'السجل' : 'History'}</h3>
                     <p className="text-xs text-gray-500">{language === 'ar' ? 'عرض النشاطات السابقة' : 'View past activities'}</p>
                  </CardContent>
               </Card>
            </div>

            {/* Transactions History */}
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'سجل النشاطات' : 'Activity History'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.length > 0 ? transactions.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.points > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {tx.points > 0 ? <ArrowRight className="w-5 h-5 -rotate-45" /> : <ArrowRight className="w-5 h-5 rotate-45" />}
                        </div>
                        <div>
                          <p className="font-medium">{tx.description || (tx.type === 'earn' ? 'Purchase Reward' : 'Redemption')}</p>
                          <p className="text-xs text-gray-400">{new Date(tx.created_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </span>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      {language === 'ar' ? 'لا توجد نشاطات حتى الآن' : 'No activities yet'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}