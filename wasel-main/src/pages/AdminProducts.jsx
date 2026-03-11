import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, createProduct, updateProduct, deleteProduct, uploadFile } from '@/api/waselClient';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowRight, Plus, Pencil, Trash2, Search, Filter, ShoppingCart, Smartphone, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import PasswordProtection from '../components/common/PasswordProtection';

export default function AdminProducts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const queryClient = useQueryClient();

  // Initial Form State
  const initialFormState = {
    name: "",
    name_en: "",
    category: "supermarket",
    subcategory: "",
    brand: "",
    price: "",
    description: "",
    description_en: "",
    image_url: "",
    available: true,
    stock: 100
  };

  const [formData, setFormData] = useState(initialFormState);

  // Fetch Products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create({
      ...data,
      price: Number(data.price),
      stock: Number(data.stock)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success("تم إضافة المنتج بنجاح");
      setIsDialogOpen(false);
      setFormData(initialFormState);
    },
    onError: () => toast.error("حدث خطأ أثناء الإضافة")
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.update(editingProduct.id, {
      ...data,
      price: Number(data.price),
      stock: Number(data.stock)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success("تم تحديث المنتج بنجاح");
      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData(initialFormState);
    },
    onError: () => toast.error("حدث خطأ أثناء التحديث")
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success("تم حذف المنتج");
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف")
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      name_en: product.name_en || "",
      category: product.category,
      subcategory: product.subcategory || "",
      brand: product.brand || "",
      price: product.price,
      description: product.description || "",
      description_en: product.description_en || "",
      image_url: product.image_url || "",
      available: product.available,
      stock: product.stock
    });
    setIsDialogOpen(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.name_en && product.name_en.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <PasswordProtection>
      <div className="min-h-screen bg-[#FDFBF7] pb-20">
        <div className="bg-[#1B4332] text-white py-8 px-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('AdminPanel')} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <ArrowRight className="w-6 h-6" />
              </Link>
              <h1 className="text-2xl font-bold">إدارة المنتجات (سوبر ماركت & إلكترونيات)</h1>
            </div>
            <Button 
              onClick={() => {
                setEditingProduct(null);
                setFormData(initialFormState);
                setIsDialogOpen(true);
              }}
              className="bg-[#52B788] hover:bg-[#40916C] text-white gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة منتج جديد
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-8">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-[#F5E6D3] mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input 
                placeholder="بحث عن منتج..." 
                className="pr-10 border-[#F5E6D3] focus:border-[#1B4332]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-[#F5E6D3]">
                  <SelectValue placeholder="القسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="supermarket">سوبر ماركت 🛒</SelectItem>
                  <SelectItem value="electronics">إلكترونيات 📱</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-xl border border-[#F5E6D3] shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                  <div className="relative h-48 bg-gray-100">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {product.category === 'supermarket' ? <ShoppingCart className="w-12 h-12" /> : <Smartphone className="w-12 h-12" />}
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                       <span className={`px-2 py-1 rounded-md text-xs font-bold text-white shadow-sm ${product.category === 'supermarket' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                         {product.category === 'supermarket' ? 'سوبر ماركت' : 'إلكترونيات'}
                       </span>
                       {!product.available && (
                         <span className="px-2 py-1 rounded-md text-xs font-bold bg-red-500 text-white shadow-sm">
                           غير متوفر
                         </span>
                       )}
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-[#1B4332] line-clamp-1">{product.name}</h3>
                        <p className="text-xs text-gray-500">{product.name_en}</p>
                      </div>
                      <span className="font-bold text-[#52B788]">{product.price.toLocaleString()} ل.س</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">{product.description}</p>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400">المخزون: {product.stock}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="text-blue-600 hover:bg-blue-50">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            if(confirm('هل أنت متأكد من حذف هذا المنتج؟')) deleteMutation.mutate(product.id);
                          }} 
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم المنتج (عربي)</Label>
                  <Input 
                    required 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم المنتج (إنجليزي)</Label>
                  <Input 
                    value={formData.name_en} 
                    onChange={(e) => setFormData({...formData, name_en: e.target.value})} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>القسم الرئيسي</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(val) => setFormData({...formData, category: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supermarket">سوبر ماركت 🛒</SelectItem>
                      <SelectItem value="electronics">إلكترونيات 📱</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>القسم الفرعي (اختياري)</Label>
                  <Input 
                    placeholder="مثلاً: خضار، هواتف سامسونج..."
                    value={formData.subcategory} 
                    onChange={(e) => setFormData({...formData, subcategory: e.target.value})} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>السعر (ل.س)</Label>
                  <Input 
                    type="number" 
                    required 
                    min="0"
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>المخزون</Label>
                  <Input 
                    type="number" 
                    min="0"
                    value={formData.stock} 
                    onChange={(e) => setFormData({...formData, stock: e.target.value})} 
                  />
                </div>
                
                <div className="col-span-full space-y-2">
                  <Label>صورة المنتج (رابط)</Label>
                  <Input 
                    placeholder="https://..."
                    value={formData.image_url} 
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})} 
                  />
                </div>

                <div className="col-span-full space-y-2">
                   <Label>الوصف (عربي)</Label>
                   <Input 
                     value={formData.description} 
                     onChange={(e) => setFormData({...formData, description: e.target.value})} 
                   />
                </div>
                
                <div className="col-span-full space-y-2">
                   <Label>الوصف (إنجليزي)</Label>
                   <Input 
                     value={formData.description_en} 
                     onChange={(e) => setFormData({...formData, description_en: e.target.value})} 
                   />
                </div>

                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.available}
                    onCheckedChange={(checked) => setFormData({...formData, available: checked})}
                  />
                  <Label>متوفر للبيع</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                <Button type="submit" className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PasswordProtection>
  );
}