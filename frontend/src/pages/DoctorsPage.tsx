/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/DoctorsPage.tsx
import { motion } from 'framer-motion';
import { Stethoscope, MapPin, HeartHandshake } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { doctorsAPI } from '@/lib/api';
import DoctorDetailDialog from './DoctorDetailDialog';
import ChatBubble from './ChatbotPage';

export default function DoctorsPage() {
  const { isAuthenticated, token } = useAuthStore();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!isAuthenticated || !token) {
        toast.error('Vui lòng đăng nhập để xem danh sách bác sĩ');
        navigate('/login');
        return;
      }

      setLoading(true);
      try {
        const res = await doctorsAPI.getAll();
        const doctorsData = Array.isArray(res.data.doctors) ? res.data.doctors : [];
        setDoctors(doctorsData);

        if (doctorsData.length === 0) {
          toast('Hiện tại chưa có bác sĩ nào tham gia tình nguyện');
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Không thể tải danh sách bác sĩ';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [isAuthenticated, token, navigate]);

  const handleCardClick = async (doctorId: string) => {
    setLoadingDetail(true);
    try {
      const res = await doctorsAPI.getById(doctorId); // API mới
      setSelectedDoctor(res.data.doctor);
      setOpenDetail(true);
    } catch (err) {
      toast.error('Không thể tải thông tin bác sĩ');
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (error && doctors.length === 0) {
    return (
      <div className="container py-10 text-center">
        <p className="text-destructive text-lg">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-8 space-y-8"
    >
      <div className="text-center">
        <h1 className="healthcare-heading text-4xl font-bold mb-3">
          Bác sĩ tình nguyện MedicalHope+
        </h1>
        <p className="text-xl text-muted-foreground">
          Kết nối miễn phí với các bác sĩ tận tâm vì cộng đồng
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="healthcare-card">
              <CardHeader className="text-center">
                <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-48 mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : doctors.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {doctors.map((doctor, index) => (
            <motion.div
              key={doctor._id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group cursor-pointer"
              onClick={() => handleCardClick(doctor._id)}
            >
              <Card className="healthcare-card h-full flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-primary/10 overflow-hidden">
                <CardHeader className="text-center pb-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24 mx-auto ring-4 ring-white shadow-lg">
                      <AvatarImage src={doctor.avatar || doctor.userId?.avatar} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-teal-500 text-white">
                        {doctor.fullName?.[0] || doctor.userId?.fullName?.[0] || 'B'}
                      </AvatarFallback>
                    </Avatar>
                    {doctor.isVolunteer && (
                      <Badge className="absolute -top-1 -right-2 bg-green-500 text-white text-xs px-3 py-1 shadow-md">
                        <HeartHandshake className="w-3 h-3 mr-1" />
                        Tình nguyện
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="mt-4 text-xl">
                    {doctor.fullName || doctor.userId?.fullName || 'Bác sĩ'}
                  </CardTitle>
                  <CardDescription className="flex items-center justify-center text-base">
                    <Stethoscope className="w-4 h-4 mr-1" />
                    {doctor.specialty || 'Đa khoa'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kinh nghiệm</span>
                      <span className="font-semibold text-primary">
                        {doctor.experience || 0} năm
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Giờ khám</span>
                      <span className="font-semibold text-primary">{Number(doctor.volunteerHours || 0).toFixed(2)} giờ</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium text-foreground truncate">
                        {doctor.location || 'Toàn quốc'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-primary/10">
                    <p className="text-center text-primary font-medium text-sm group-hover:text-primary transition-colors">
                      Nhấn để xem chi tiết và đặt lịch
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            <Stethoscope className="w-16 h-16 text-muted-foreground" />
          </div>
          <p className="text-xl text-muted-foreground">
            Hiện chưa có bác sĩ nào tham gia chương trình tình nguyện
          </p>
          <p className="text-muted-foreground mt-2">
            Vui lòng quay lại sau hoặc liên hệ admin nhé
          </p>
        </div>
      )}

      {/* Dialog chi tiết bác sĩ */}
      <DoctorDetailDialog
        doctor={selectedDoctor}
        open={openDetail}
        onOpenChange={setOpenDetail}
      />

      {loadingDetail && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8">
            <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto mt-3" />
          </div>
        </div>
      )}

      {!isAdmin && <ChatBubble />}
    </motion.div>
  );
}