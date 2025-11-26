// src/components/doctors/DoctorDetailDialog.tsx
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Stethoscope,
  MapPin,
  Calendar,
  Clock3,
  Phone,
  Mail,
  HeartHandshake,
  Users,
  Award,
} from 'lucide-react';
import BookAppointmentForm from '@/components/form/BookAppointmentForm';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Doctor {
  _id: string;
  fullName: string;
  avatar?: string;
  specialty?: string;
  experience?: number;
  location: string;
  email?: string;
  phone?: string;
  bio?: string;
  isVolunteer?: boolean;
  totalPatients?: number;
  volunteerHours?: number;
  upcomingSlots?: { date: string; times: string[] }[];
}

interface DoctorDetailDialogProps {
  doctor: Doctor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DoctorDetailDialog({ doctor, open, onOpenChange }: DoctorDetailDialogProps) {
  const [showBookForm, setShowBookForm] = useState(false);

  if (!doctor) return null;

  // Hàm format ngày chuẩn tiếng Việt
  const formatVietnameseDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.toLocaleDateString('vi-VN', { weekday: 'long' }); // Thứ Hai, Thứ Ba...
    const displayDate = date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
    return { dayOfWeek, displayDate };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl">
        {/* Header gradient đẹp */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-t-2xl px-6 pt-8 pb-12">
          <h2 className="text-2xl font-bold text-center">Thông tin bác sĩ</h2>
        </div>

        <div className="px-6 pb-8 -mt-10">
          {/* Avatar + Tên */}
          <div className="flex flex-col items-center text-center mb-6">
            <Avatar className="w-28 h-28 ring-8 ring-white shadow-2xl border-4 border-white">
              <AvatarImage src={doctor.avatar} alt={doctor.fullName} />
              <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-blue-500 to-teal-500 text-white">
                {doctor.fullName.split(' ').pop()?.[0]}
              </AvatarFallback>
            </Avatar>

            <h3 className="mt-5 text-2xl font-bold text-gray-900">{doctor.fullName}</h3>
            <p className="text-lg font-medium text-blue-600 flex items-center gap-2 mt-1">
              <Stethoscope className="w-5 h-5" />
              {doctor.specialty || 'Bác sĩ đa khoa'}
            </p>

            {doctor.isVolunteer && (
              <Badge className="mt-3 bg-emerald-100 text-emerald-700 font-medium px-4 py-1.5">
                <HeartHandshake className="w-4 h-4 mr-1.5" />
                Bác sĩ tình nguyện
              </Badge>
            )}
          </div>

          <Separator className="mb-6" />

          {/* Thông tin nhanh */}
          <div className="grid grid-cols-2 gap-5 text-sm">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-muted-foreground">Kinh nghiệm</p>
                <p className="font-semibold text-lg">{doctor.experience || 0} năm</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-muted-foreground">Khu vực</p>
                <p className="font-semibold">{doctor.location}</p>
              </div>
            </div>

            {doctor.phone && (
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-muted-foreground">Điện thoại</p>
                  <p className="font-semibold">{doctor.phone}</p>
                </div>
              </div>
            )}

            {doctor.email && (
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium text-sm break-all">{doctor.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Thống kê 3 ô */}
          <div className="grid grid-cols-3 gap-4 my-8">
            <div className="text-center p-5 bg-blue-50 rounded-2xl">
              <Users className="w-9 h-9 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-blue-600">{doctor.totalPatients || 0}</p>
              <p className="text-xs text-muted-foreground">Bệnh nhân</p>
            </div>
            <div className="text-center p-5 bg-emerald-50 rounded-2xl">
              <Clock3 className="w-9 h-9 mx-auto text-emerald-600 mb-2" />
              <p className="text-2xl font-bold text-emerald-600">{doctor.volunteerHours || 0}h</p>
              <p className="text-xs text-muted-foreground">Tình nguyện</p>
            </div>
            <div className="text-center p-5 bg-purple-50 rounded-2xl">
              <Calendar className="w-9 h-9 mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-purple-600">{doctor.upcomingSlots?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Ngày rảnh</p>
            </div>
          </div>

          {/* Giới thiệu */}
          {doctor.bio && (
            <div className="mb-6">
              <h4 className="font-semibold text-lg mb-3">Giới thiệu</h4>
              <p className="text-muted-foreground text-sm leading-relaxed bg-gray-50 p-4 rounded-xl">
                {doctor.bio}
              </p>
            </div>
          )}

          {/* Lịch rảnh - ĐÃ FIX "Thứ Hai, Thứ Ba" chuẩn 100% */}
          {doctor.upcomingSlots && doctor.upcomingSlots.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Lịch rảnh sắp tới
              </h4>
              <div className="space-y-3">
                {doctor.upcomingSlots.slice(0, 5).map((slot, i) => {
                  const { dayOfWeek, displayDate } = formatVietnameseDate(slot.date);
                  return (
                    <div key={i} className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900">{displayDate}</p>
                        <p className="text-sm text-muted-foreground">{dayOfWeek}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {slot.times.slice(0, 4).map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs font-medium">
                            {t}
                          </Badge>
                        ))}
                        {slot.times.length > 4 && (
                          <Badge variant="outline" className="text-xs">+{slot.times.length - 4}</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                {doctor.upcomingSlots.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground mt-3">
                    Và còn {doctor.upcomingSlots.length - 5} ngày khác...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Nút cố định dưới cùng */}
          <div className="sticky bottom-0 left-0 right-0 bg-white pt-5 -mx-6 px-6 border-t">
            <div className="flex gap-3">
              <Button
                className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                size="lg"
                onClick={() => setShowBookForm(true)}
              >
                <Calendar className="mr-2 w-5 h-5" />
                Đặt lịch khám miễn phí
              </Button>
              <Button variant="outline" size="lg" className="px-8" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>

        {/* Form đặt lịch */}
        <BookAppointmentForm
          open={showBookForm}
          onOpenChange={setShowBookForm}
          doctor={{
            id: doctor._id,
            name: doctor.fullName,
            specialty: doctor.specialty || 'Bác sĩ đa khoa',
            avatar: doctor.avatar || '',
            experience: doctor.experience || 0,
          }}
          onSuccess={() => {
            toast.success('Đặt lịch thành công! Bác sĩ sẽ liên hệ bạn sớm nhất');
            setShowBookForm(false);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}