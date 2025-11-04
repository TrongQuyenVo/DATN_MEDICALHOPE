import { motion } from 'framer-motion';
import { Stethoscope, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Thêm để redirect
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { doctorsAPI } from '@/lib/api'; // Import doctorsAPI từ api.ts
import BookAppointmentForm from '@/components/form/BookAppointmentForm';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';

export default function DoctorsPage() {
  const { isAuthenticated, token } = useAuthStore(); // Lấy trạng thái xác thực và token
  const navigate = useNavigate(); // Để redirect nếu chưa đăng nhập
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!isAuthenticated || !token) {
        setError('Vui lòng đăng nhập để xem danh sách bác sĩ.');
        toast.error('Vui lòng đăng nhập để tiếp tục.');
        navigate('/login');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await doctorsAPI.getAll(); // Sử dụng doctorsAPI.getAll

        const doctorsData = Array.isArray(response.data.doctors)
          ? response.data.doctors
          : [];
        setDoctors(doctorsData);
        if (doctorsData.length === 0) {
          setError('Không có bác sĩ nào được tìm thấy trong hệ thống.');
          toast('Không có bác sĩ nào được tìm thấy trong hệ thống.');
        }
      } catch (error) {
        console.error('Lỗi tải danh sách bác sĩ:', error);
        setError(error.response?.data?.message || 'Không thể tải danh sách bác sĩ');
        // toast.error đã được xử lý trong interceptor của api.ts
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [isAuthenticated, token, navigate]);

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setOpenDialog(true);
  };

  if (error) {
    return (
      <Card className="healthcare-card">
        <CardHeader>
          <CardTitle className="healthcare-heading">Có lỗi xảy ra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="healthcare-heading text-3xl font-bold">Bác sĩ tình nguyện</h1>
        <p className="healthcare-subtitle">Tìm kiếm và kết nối với các bác sĩ chuyên khoa</p>
      </div>

      {loading ? (
        <div className="text-center py-8">Đang tải danh sách bác sĩ...</div>
      ) : doctors && doctors.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor, index) => (
            <motion.div
              key={doctor._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="healthcare-card">
                <CardHeader className="text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src={doctor.userId?.avatar || doctor.avatar || ''} />
                    <AvatarFallback className="text-lg bg-gradient-primary text-white">
                      {doctor.userId?.fullName?.charAt(0) || 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="healthcare-heading">
                    {doctor.userId?.fullName || 'Không xác định'}
                  </CardTitle>
                  <CardDescription className="flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 mr-1" />
                    {doctor.specialty || 'Không xác định'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Kinh nghiệm</span>
                    <span className="font-medium">{doctor.experience || 0} năm</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Địa điểm</span>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="font-medium">{doctor.location || 'Không xác định'}</span>
                    </div>
                  </div>
                  {doctor.isVolunteer && (
                    <Badge className="w-full justify-center bg-success text-success-foreground">
                      Tình nguyện viên
                    </Badge>
                  )}
                  <Button
                    className="w-full btn-healthcare"
                    onClick={() => handleBookAppointment(doctor)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Đặt lịch hẹn
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Không tìm thấy bác sĩ nào. Vui lòng kiểm tra lại sau.
        </div>
      )}

      {selectedDoctor && (
        <BookAppointmentForm
          open={openDialog}
          onOpenChange={setOpenDialog}
          doctor={{
            id: selectedDoctor._id,
            name: selectedDoctor.userId?.fullName || 'Không xác định',
            specialty: selectedDoctor.specialty || 'Không xác định',
            avatar: selectedDoctor.userId?.avatar || selectedDoctor.avatar || '',
            experience: selectedDoctor.experience || 0,
          }}
          onSuccess={() => {
            toast.success("Đặt lịch hẹn thành công!");
            setOpenDialog(false);
          }}
        />
      )}
      <ScrollToTop />
      <ChatBubble />
    </motion.div>
  );
}