import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit, Save, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have this or use Input
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

export default function AdminStories() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    media_type: 'image',
    video_url: ''
  });

  const queryClient = useQueryClient();

  // Fetch Stories
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['admin-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        if (editingStory) {
            // Update
            const { error } = await supabase
                .from('stories')
                .update(formData)
                .eq('id', editingStory.id);
            if (error) throw error;
            toast.success('تم تحديث القصة بنجاح');
        } else {
            // Create
            const { error } = await supabase
                .from('stories')
                .insert([formData]);
            if (error) throw error;
            toast.success('تم إضافة القصة بنجاح');
        }
        
        queryClient.invalidateQueries(['admin-stories']);
        setIsDialogOpen(false);
        resetForm();
    } catch (err) {
        console.error(err);
        toast.error('حدث خطأ أثناء الحفظ');
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id) => {
      if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
      
      try {
          const { error } = await supabase.from('stories').delete().eq('id', id);
          if (error) throw error;
          toast.success('تم الحذف بنجاح');
          queryClient.invalidateQueries(['admin-stories']);
      } catch (err) {
          toast.error('فشل الحذف');
      }
  };

  const resetForm = () => {
      setFormData({ title: '', content: '', image_url: '', media_type: 'image', video_url: '' });
      setEditingStory(null);
  };

  const openEdit = (story) => {
      setEditingStory(story);
      setFormData({
          title: story.title,
          content: story.content,
          image_url: story.image_url,
          media_type: story.media_type,
          video_url: story.video_url || ''
      });
      setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#1B4332] font-['Cairo']">إدارة القصص المحلية</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-[#1B4332] hover:bg-[#2D6A4F] gap-2">
                <Plus className="w-4 h-4" />
                قصة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl font-['Cairo']" dir="rtl">
              <DialogHeader>
                <DialogTitle>{editingStory ? 'تعديل القصة' : 'إضافة قصة جديدة'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>عنوان القصة</Label>
                  <Input 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="عنوان جذاب..."
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>المحتوى</Label>
                  <textarea 
                    className="w-full min-h-[100px] p-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    placeholder="اكتب تفاصيل القصة هنا..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>رابط الصورة</Label>
                        <Input 
                            value={formData.image_url}
                            onChange={e => setFormData({...formData, image_url: e.target.value})}
                            placeholder="https://..."
                        />
                    </div>
                     <div className="space-y-2">
                        <Label>نوع الوسائط</Label>
                        <select 
                            className="w-full h-10 px-3 rounded-md border border-gray-200"
                            value={formData.media_type}
                            onChange={e => setFormData({...formData, media_type: e.target.value})}
                        >
                            <option value="image">صورة (Image)</option>
                            <option value="video">فيديو (Video)</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                    <Button type="submit" className="bg-[#1B4332]" disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                        {editingStory ? 'حفظ التعديلات' : 'نشر القصة'}
                    </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#1B4332]" /></div>
        ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map(story => (
                    <div key={story.id} className="bg-white rounded-xl shadow-sm border p-4 group relative">
                        <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg shadow-sm z-10">
                            <button onClick={() => openEdit(story)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md">
                                <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(story.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="h-40 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                            <img src={story.image_url} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">{story.title}</h3>
                        <p className="text-gray-500 text-sm line-clamp-3 mb-4">{story.content}</p>
                        <div className="text-xs text-gray-400">
                            {new Date(story.created_at).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
