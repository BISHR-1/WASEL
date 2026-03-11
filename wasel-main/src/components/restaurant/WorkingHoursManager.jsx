import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Save, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const days = [
  { key: 'sunday', name: 'الأحد' },
  { key: 'monday', name: 'الإثنين' },
  { key: 'tuesday', name: 'الثلاثاء' },
  { key: 'wednesday', name: 'الأربعاء' },
  { key: 'thursday', name: 'الخميس' },
  { key: 'friday', name: 'الجمعة' },
  { key: 'saturday', name: 'السبت' }
];

export default function WorkingHoursManager({ restaurant }) {
  const [workingHours, setWorkingHours] = useState(
    restaurant.working_hours || {
      sunday: { open: '09:00', close: '22:00', closed: false },
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '09:00', close: '22:00', closed: false }
    }
  );

  const queryClient = useQueryClient();

  const updateHoursMutation = useMutation({
    mutationFn: (data) => base44.entities.Restaurant.update(restaurant.id, { working_hours: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRestaurants'] });
      alert('تم حفظ ساعات العمل بنجاح!');
    }
  });

  const handleDayChange = (day, field, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateHoursMutation.mutate(workingHours);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#1B4332] mb-2">ساعات العمل</h2>
        <p className="text-[#1B4332]/60 text-sm">حدد أوقات عمل المطعم خلال الأسبوع</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Days */}
        {days.map(({ key, name }) => (
          <div key={key} className="bg-white rounded-xl p-4 border border-[#F5E6D3]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#52B788]" />
                <span className="font-semibold text-[#1B4332]">{name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`${key}-closed`} className="text-sm text-[#1B4332]/60">
                  {workingHours[key]?.closed ? 'مغلق' : 'مفتوح'}
                </Label>
                <Switch
                  id={`${key}-closed`}
                  checked={!workingHours[key]?.closed}
                  onCheckedChange={(checked) => handleDayChange(key, 'closed', !checked)}
                />
              </div>
            </div>

            {!workingHours[key]?.closed && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-[#1B4332]/60 mb-1 block">وقت الفتح</Label>
                  <Input
                    type="time"
                    value={workingHours[key]?.open || '09:00'}
                    onChange={(e) => handleDayChange(key, 'open', e.target.value)}
                    className="border-[#F5E6D3]"
                  />
                </div>
                <div>
                  <Label className="text-sm text-[#1B4332]/60 mb-1 block">وقت الإغلاق</Label>
                  <Input
                    type="time"
                    value={workingHours[key]?.close || '22:00'}
                    onChange={(e) => handleDayChange(key, 'close', e.target.value)}
                    className="border-[#F5E6D3]"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={updateHoursMutation.isPending}
            className="bg-[#1B4332] gap-2"
          >
            {updateHoursMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                حفظ ساعات العمل
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}