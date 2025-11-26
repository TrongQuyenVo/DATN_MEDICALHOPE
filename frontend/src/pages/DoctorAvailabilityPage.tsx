/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  Save,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import api from '@/lib/api';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';

export default function DoctorAvailabilityPage() {
  const [slots, setSlots] = useState<any[]>([]);
  const [originalSlots, setOriginalSlots] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/doctors/profile');
        if (res.data.success && res.data.doctor?.availableSlots) {
          const valid = res.data.doctor.availableSlots
            .filter((s: any) => s.date >= today && s.isActive !== false)
            .sort((a: any, b: any) => a.date.localeCompare(b.date));

          setSlots(valid);
          setOriginalSlots(JSON.parse(JSON.stringify(valid)));
        }
      } catch {
        toast.error('Không tải được lịch rảnh');
      }
    };
    load();
  }, [(today)]);

  // === Các hàm xử lý giống trước (giữ nguyên logic) ===
  const handleAddSlot = () => {
    const next = new Date();
    next.setDate(next.getDate() + 7);
    const nextDate = next.toISOString().split('T')[0];
    if (slots.some(s => s.date === nextDate)) return toast.error('Ngày này đã có rồi!');
    setSlots([...slots, { date: nextDate, times: ['09:00'], isActive: true }]);
  };

  const handleDateChange = (i: number, date: string) => {
    if (date < today) return toast.error('Không chọn ngày quá khứ');
    if (slots.some((s, idx) => idx !== i && s.date === date)) return toast.error('Ngày này đã tồn tại!');
    const updated = [...slots];
    updated[i].date = date;
    setSlots(updated);
  };

  const handleAddTime = (dateIdx: number) => {
    const updated = [...slots];
    const newTime = '14:00';
    if (updated[dateIdx].times.includes(newTime)) return toast.error('Giờ này đã có rồi!');
    updated[dateIdx].times.push(newTime);
    updated[dateIdx].times.sort();
    setSlots(updated);
  };

  const handleTimeChange = (dateIdx: number, timeIdx: number, value: string) => {
    if (!value) return;
    const updated = [...slots];
    const times = updated[dateIdx].times;
    const others = times.filter((_: any, i: number) => i !== timeIdx);
    if (others.includes(value)) return toast.error('Khung giờ này đã tồn tại trong ngày!');
    times[timeIdx] = value;
    times.sort();
    setSlots(updated);
  };

  const handleDeleteTime = (dateIdx: number, timeIdx: number) => {
    if (slots[dateIdx].times.length <= 1) return toast.error('Phải có ít nhất 1 khung giờ');
    const updated = [...slots];
    updated[dateIdx].times.splice(timeIdx, 1);
    setSlots(updated);
  };

  const handleDeleteDate = (i: number) => setSlots(slots.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    // Validation giống trước...
    let error = false;
    const dates = slots.map(s => s.date);
    if (new Set(dates).size < dates.length) { toast.error('Có ngày bị trùng!'); error = true; }
    for (const slot of slots) {
      const times = slot.times.filter((t: string) => t.trim());
      if (new Set(times).size < times.length) {
        toast.error(`Ngày ${slot.date} có khung giờ bị trùng!`);
        error = true;
      }
    }
    if (error) return;

    const cleaned = slots
      .map(s => ({
        date: s.date,
        times: [...new Set(s.times.filter((t: string) => t.trim()))].sort(),
        isActive: true,
      }))
      .filter(s => s.times.length > 0);

    if (cleaned.length === 0) return toast.error('Phải có ít nhất 1 ngày!');

    try {
      setLoading(true);
      await api.put('/doctors/availability', { availableSlots: cleaned });
      toast.success('Cập nhật lịch thành công!');
      setOriginalSlots(JSON.parse(JSON.stringify(cleaned)));
      setSlots(cleaned);
      setIsEditing(false);
    } catch {
      toast.error('Lỗi khi lưu');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSlots(JSON.parse(JSON.stringify(originalSlots)));
    setIsEditing(false);
    toast('Đã hủy thay đổi');
  };

  return !isEditing ? (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto p-4 sm:p-6">
      <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-700 text-white pb-8">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold">Lịch rảnh khám tình nguyện</CardTitle>
              <p className="text-blue-100 mt-2 text-sm sm:text-base">
                {slots.length === 0 ? 'Chưa có lịch mở' : `Đã mở ${slots.length} ngày khám miễn phí`}
              </p>
            </div>
            <Clock className="w-12 h-12 opacity-80" />
          </div>
        </CardHeader>

        <CardContent className="pt-6 pb-8">
          {slots.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-lg text-muted-foreground mb-8">Bạn chưa mở lịch khám tình nguyện</p>
              <Button size="lg" onClick={() => setIsEditing(true)}>
                <PlusCircle className="mr-2" /> Mở lịch ngay
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {slots.map((slot, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg">
                        {new Date(slot.date).toLocaleDateString('vi-VN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </h3>
                      <Badge variant="secondary">{slot.times.length} khung giờ</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {slot.times.map((t: string, j: number) => (
                        <Badge key={j} variant="outline" className="font-mono text-sm">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              <Separator className="my-8" />

              <Button className="w-full" size="lg" onClick={() => setIsEditing(true)}>
                <Calendar className="mr-2 w-5 h-5" /> Chỉnh sửa lịch
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  ) : (
    /* ===================== EDIT MODE – SẠCH SẼ & HIỆN ĐẠI ===================== */
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto p-4 sm:p-6">
      <Card className="border-0 shadow-xl ">
        <CardHeader className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold">Chỉnh sửa lịch rảnh</CardTitle>
              <p className="text-emerald-100 mt-1 text-sm sm:text-base">Thêm/xóa ngày và khung giờ dễ dàng</p>
            </div>
            <Calendar className="w-10 h-10 opacity-90" />
          </div>
        </CardHeader>

        <CardContent className="pt-8 space-y-8">
          {slots.map((slot, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 rounded-xl p-6 bg-gray-50/50"
            >
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-5">
                <Input
                  type="date"
                  value={slot.date}
                  min={today}
                  onChange={e => handleDateChange(i, e.target.value)}
                  className="text-base font-medium w-full sm:w-48"
                />
                <Button variant="destructive" size="sm" onClick={() => handleDeleteDate(i)}>
                  <Trash2 className="mr-2 w-4 h-4" /> Xóa ngày
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {slot.times.map((time: string, j: number) => (
                  <div key={j} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={time}
                      onChange={e => handleTimeChange(i, j, e.target.value)}
                      className="text-base font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:bg-red-50 h-10 w-10"
                      onClick={() => handleDeleteTime(i, j)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="h-10" onClick={() => handleAddTime(i)}>
                  <PlusCircle className="mr-2 w-4 h-4" /> Thêm giờ
                </Button>
              </div>
            </motion.div>
          ))}

          <Button variant="outline" className="w-full h-12" size="lg" onClick={handleAddSlot}>
            <PlusCircle className="mr-2 w-5 h-5" /> Thêm ngày mới
          </Button>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button className="flex-1 h-12 text-lg font-medium" size="lg" onClick={handleSave} disabled={loading}>
              {loading ? 'Đang lưu...' : <> <Save className="mr-2 w-5 h-5" /> Lưu thay đổi</>}
            </Button>
            <Button variant="outline" className="flex-1 h-12 text-lg" size="lg" onClick={handleCancel} disabled={loading}>
              Hủy bỏ
            </Button>
          </div>
        </CardContent>
      </Card>

      <ScrollToTop />
      <ChatBubble />
    </motion.div>
  );
}