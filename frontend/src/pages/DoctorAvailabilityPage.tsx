import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Calendar, Clock, Save, PlusCircle } from 'lucide-react';
import api from '@/lib/api';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';

export default function DoctorAvailabilityPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [slots, setSlots] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  //Load từ DB
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/doctors/profile');
        if (res.data.success && res.data.doctor.availableSlots) {
          setSlots(res.data.doctor.availableSlots);
        }
      } catch {
        toast.error('Không thể tải lịch rảnh');
      }
    })();
  }, []);

  //Thêm ngày mới
  const handleAddSlot = () => {
    setSlots([...slots, { date: '', times: [''], isActive: true }]);
  };

  //Cập nhật ngày
  const handleDateChange = (index: number, value: string) => {
    const updated = [...slots];
    updated[index].date = value;
    setSlots(updated);
  };

  //Cập nhật từng giờ trong danh sách times
  const handleTimeChange = (dateIndex: number, timeIndex: number, value: string) => {
    const updated = [...slots];
    updated[dateIndex].times[timeIndex] = value;
    setSlots(updated);
  };

  //Thêm khung giờ cho 1 ngày
  const handleAddTime = (index: number) => {
    const updated = [...slots];
    updated[index].times.push('');
    setSlots(updated);
  };

  //Xóa 1 khung giờ
  const handleDeleteTime = (dateIndex: number, timeIndex: number) => {
    const updated = [...slots];
    updated[dateIndex].times.splice(timeIndex, 1);
    setSlots(updated);
  };

  //Xóa 1 ngày
  const handleDeleteDate = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  //Lưu lịch rảnh
  const handleSave = async () => {
    try {
      setLoading(true);

      const availableSlots = slots
        .filter((s) => s.date && s.times.some((t) => t.trim() !== ''))
        .map((s) => ({
          date: s.date,
          times: s.times.filter((t) => t.trim() !== ''),
          isActive: true,
        }));

      await api.put('/doctors/availability', { availableSlots });
      toast.success('Cập nhật lịch rảnh thành công!');
      setIsEditing(false);
    } catch {
      toast.error('Lỗi khi lưu lịch rảnh');
    } finally {
      setLoading(false);
    }
  };

  //View Mode
  if (!isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto p-6"
      >
        <Card className="shadow-lg border-primary/20 text-center">
          <CardHeader>
            <Clock className="w-10 h-10 text-primary mx-auto" />
            <CardTitle className="text-2xl font-bold text-primary">
              Lịch rảnh của bạn
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {slots.length === 0 ? (
              <div className="py-10 text-muted-foreground">
                <p className="text-lg mb-4">
                  Hiện tại bạn chưa khai báo lịch rảnh nào.
                </p>
                <Button onClick={() => setIsEditing(true)} className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Khai báo lịch rảnh
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {slots.map((s, i) => (
                  <div key={i} className="p-4 border rounded-xl bg-card/50 text-left">
                    <p className="font-semibold mb-1">📅 {s.date}</p>
                    <p className="text-muted-foreground">
                      {s.times && s.times.length > 0
                        ? s.times.join(', ')
                        : 'Không có giờ nào'}
                    </p>
                  </div>
                ))}
                <Separator />
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="secondary"
                  className="w-full gap-2"
                >
                  Chỉnh sửa lịch
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  //Edit Mode
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto p-6"
    >
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="flex flex-col items-center gap-2 text-center">
          <Calendar className="w-10 h-10 text-primary" />
          <CardTitle className="text-2xl font-bold text-primary">
            Cập nhật lịch rảnh theo ngày
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Chọn ngày và thêm các khung giờ bạn có thể làm việc.
          </p>
        </CardHeader>

        <Separator className="my-2" />

        <CardContent className="space-y-4">
          {slots.map((slot, i) => (
            <div
              key={slot.date || `slot-${i}`}
              className="p-4 rounded-xl border border-border bg-card/50"
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-3">
                <Input
                  type="date"
                  value={slot.date}
                  onChange={(e) => handleDateChange(i, e.target.value)}
                  className="w-full md:w-1/3"
                />
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteDate(i)}
                  className="md:w-auto"
                >
                  Xóa ngày
                </Button>
              </div>

              <div className="space-y-2">
                {slot.times.map((time, j) => (
                  <div
                    key={`${slot.date}-${time || j}`}
                    className="flex items-center gap-3"
                  >
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(i, j, e.target.value)}
                      className="w-1/3"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTime(i, j)}
                    >
                      Xóa giờ
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => handleAddTime(i)}
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Thêm khung giờ
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={handleAddSlot}
          >
            <PlusCircle className="w-4 h-4 mr-2" /> Thêm ngày mới
          </Button>

          <div className="flex gap-3 mt-6">
            <Button
              className="w-full font-semibold"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Lưu thay đổi
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsEditing(false)}
              disabled={loading}
            >
              Hủy
            </Button>
          </div>
        </CardContent>
      </Card>
      <ScrollToTop />
            <ChatBubble />
    </motion.div>
  );
}
