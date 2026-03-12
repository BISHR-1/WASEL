import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getSavedAddresses, saveAddresses as persistAddresses } from '@/utils/senderReceiverStorage';
import { getCountriesArabicNames } from '@/utils/countryData';
import { getUserRegion, isInsideSyria } from '@/lib/userRegion';

export default function MyAddresses() {
  const insideSyria = isInsideSyria(getUserRegion());
  const [addresses, setAddresses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    phone: '',
    street: '',
    sender_name: '',
    sender_phone: '',
    sender_country: 'الإمارات',
    building: '',
    floor: '',
    notes: ''
  });

  const countryOptions = getCountriesArabicNames();

  useEffect(() => {
    const saved = getSavedAddresses();
    setAddresses(saved);
  }, []);

  const saveAddresses = (newAddresses) => {
    persistAddresses(newAddresses);
    setAddresses(newAddresses);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.label || !formData.phone || !formData.street) {
      toast.error('الرجاء إدخال اسم المستلم ورقم الهاتف والعنوان');
      return;
    }

    if (editingId) {
      // تحديث عنوان موجود
      const updated = addresses.map(addr =>
        addr.id === editingId ? { ...addr, ...formData } : addr
      );
      saveAddresses(updated);
      toast.success('تم تحديث العنوان بنجاح');
      setEditingId(null);
    } else {
      // إضافة عنوان جديد
      const newAddress = {
        id: Date.now().toString(),
        ...formData,
        isSelected: addresses.length === 0, // العنوان الأول يكون مختار تلقائياً
        createdAt: new Date().toISOString()
      };
      saveAddresses([...addresses, newAddress]);
      toast.success('تمت إضافة العنوان بنجاح');
    }

    setFormData({ label: '', phone: '', street: '', sender_name: '', sender_phone: '', sender_country: 'الإمارات', building: '', floor: '', notes: '' });
    setShowAddForm(false);
  };

  const selectAddress = (id) => {
    const updated = addresses.map(addr => ({
      ...addr,
      isSelected: addr.id === id
    }));
    saveAddresses(updated);
    toast.success('تم تحديد العنوان');
  };

  const deleteAddress = (id) => {
    if (window.confirm('هل تريد حذف هذا العنوان؟')) {
      const remaining = addresses.filter(addr => addr.id !== id);
      // إذا كان العنوان المحذوف مختار، اختر العنوان الأول
      if (remaining.length > 0 && addresses.find(a => a.id === id)?.isSelected) {
        remaining[0].isSelected = true;
      }
      saveAddresses(remaining);
      toast.success('تم حذف العنوان');
    }
  };

  const startEdit = (address) => {
    setFormData({
      label: address.label,
      phone: address.phone || '',
      street: address.street,
        sender_name: address.sender_name || '',
        sender_phone: address.sender_phone || '',
        sender_country: address.sender_country || 'الإمارات',
      building: address.building || '',
      floor: address.floor || '',
      notes: address.notes || ''
    });
    setEditingId(address.id);
    setShowAddForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 pb-24">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-100 to-gray-200 pt-6 pb-8 px-4 rounded-b-[2rem] shadow-lg"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-500" />
              عناويني
            </h1>
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingId(null);
                setFormData({ label: '', phone: '', street: '', sender_name: '', sender_phone: '', sender_country: 'الإمارات', building: '', floor: '', notes: '' });
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة عنوان
            </button>
          </div>
          <p className="text-gray-600">
            {addresses.length} عنوان محفوظ
          </p>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* Add/Edit Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {editingId ? 'تعديل العنوان' : 'إضافة عنوان جديد'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="label" className="text-gray-700 font-semibold">اسم المستلم *</Label>
                    <Input
                      id="label"
                      placeholder="مثال: محمد الأحمد"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-gray-700 font-semibold">رقم الهاتف *</Label>
                    <Input
                      id="phone"
                      placeholder="09xxxxxxxx"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="street" className="text-gray-700 font-semibold">العنوان بالتفصيل *</Label>
                    <Input
                      id="street"
                      placeholder="المدينة، الحي، الشارع، أقرب نقطة دالة"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="mt-1"
                      required
                    />
                  </div>

                    {!insideSyria && (
                    <div className="rounded-xl border border-gray-200 p-3 bg-gray-50/60">
                    <p className="text-sm font-bold text-gray-700 mb-3">بيانات المرسل المرتبطة بهذا العنوان</p>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="sender_name" className="text-gray-700 font-semibold">اسم المرسل</Label>
                        <Input
                          id="sender_name"
                          placeholder="اسم المرسل"
                          value={formData.sender_name}
                          onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="sender_phone" className="text-gray-700 font-semibold">رقم المرسل</Label>
                        <Input
                          id="sender_phone"
                          placeholder="رقم واتساب المرسل"
                          value={formData.sender_phone}
                          onChange={(e) => setFormData({ ...formData, sender_phone: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="sender_country" className="text-gray-700 font-semibold">دولة المرسل</Label>
                        <select
                          id="sender_country"
                          value={formData.sender_country}
                          onChange={(e) => setFormData({ ...formData, sender_country: e.target.value })}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        >
                          {countryOptions.map((country) => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    </div>
                    )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="building" className="text-gray-700 font-semibold">رقم البناء</Label>
                      <Input
                        id="building"
                        placeholder="مثال: 15"
                        value={formData.building}
                        onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="floor" className="text-gray-700 font-semibold">الطابق</Label>
                      <Input
                        id="floor"
                        placeholder="مثال: الثالث"
                        value={formData.floor}
                        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-gray-700 font-semibold">ملاحظات</Label>
                    <textarea
                      id="notes"
                      placeholder="أي تفاصيل إضافية تساعد السائق..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                      <Check className="w-5 h-5 mr-2" />
                      {editingId ? 'تحديث' : 'حفظ'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingId(null);
                        setFormData({ label: '', phone: '', street: '', sender_name: '', sender_phone: '', sender_country: 'الإمارات', building: '', floor: '', notes: '' });
                      }}
                      className="flex-1"
                    >
                      <X className="w-5 h-5 mr-2" />
                      إلغاء
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-32 h-32 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <MapPin className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              لا توجد عناوين محفوظة
            </h2>
            <p className="text-gray-600 mb-6">
              أضف عنوانك الأول لتسهيل عملية التوصيل
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address, index) => (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-2xl shadow-lg p-6 cursor-pointer transition-all ${
                  address.isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => !address.isSelected && selectAddress(address.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className={`w-6 h-6 ${address.isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                      <h3 className="text-xl font-bold text-gray-800">{address.label}</h3>
                      {address.isSelected && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm font-bold rounded-full">
                          مختار
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mr-9">{address.street}</p>
                    {address.phone && (
                      <p className="text-gray-500 text-sm mr-9">الهاتف: {address.phone}</p>
                    )}
                    {!insideSyria && address.sender_name && (
                      <p className="text-gray-500 text-sm mr-9">المرسل: {address.sender_name}</p>
                    )}
                    {!insideSyria && address.sender_phone && (
                      <p className="text-gray-500 text-sm mr-9">رقم المرسل: {address.sender_phone}</p>
                    )}
                    {!insideSyria && address.sender_country && (
                      <p className="text-gray-500 text-sm mr-9">دولة المرسل: {address.sender_country}</p>
                    )}
                    {address.building && (
                      <p className="text-gray-500 text-sm mr-9">بناء {address.building}</p>
                    )}
                    {address.floor && (
                      <p className="text-gray-500 text-sm mr-9">الطابق {address.floor}</p>
                    )}
                    {address.notes && (
                      <p className="text-gray-500 text-sm mr-9 mt-2 italic">{address.notes}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(address);
                      }}
                      className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAddress(address.id);
                      }}
                      className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-200 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating decorations */}
      <div className="fixed top-20 left-10 w-20 h-20 bg-blue-200/20 rounded-full blur-2xl pointer-events-none" />
      <div className="fixed bottom-40 right-10 w-32 h-32 bg-gray-300/20 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
