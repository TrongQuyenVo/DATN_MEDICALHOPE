// src/pages/PatientDashboard.jsx
import { motion } from 'framer-motion';
import { Calendar, Stethoscope, Gift, HandHeart, MessageCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { appointmentsAPI, notificationsAPI } from '@/lib/api'; // <-- Đảm bảo import đúng
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import ChatBubble from '@/pages/ChatbotPage';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    upcoming: 0,
    history: 0,
    support: 0,
    messages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Gọi API lấy lịch hẹn và thông báo
        const [appointmentsRes, notificationsRes] = await Promise.all([
          appointmentsAPI.getAll({ patient: true }), // Chỉ lấy của bệnh nhân
          notificationsAPI.getAll({ limit: 10 }),
        ]);

        const appointmentsData = appointmentsRes.data.appointments || [];
        const notificationsData = notificationsRes.data.notifications || [];

        setAppointments(appointmentsData);
        setNotifications(notificationsData);

        // Tính toán thống kê
        const now = new Date();
        const upcomingCount = appointmentsData.filter(
          (apt) => new Date(apt.scheduledTime) > now
        ).length;

        const donationNotifications = notificationsData.filter(
          (n) => n.type === 'donation'
        ).length;

        const messageNotifications = notificationsData.filter(
          (n) => n.type === 'system' || n.type === 'reminder' || n.type === 'alert'
        ).length;

        setStats({
          upcoming: upcomingCount,
          history: appointmentsData.length,
          support: donationNotifications,
          messages: messageNotifications,
        });
      } catch (err) {
        console.error('Lỗi tải dashboard:', err);
        const msg = err.response?.data?.message || 'Không thể tải dữ liệu';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  const quickActions = [
    { title: 'Đặt lịch khám', icon: Calendar, path: '/appointments' },
    { title: 'Tìm bác sĩ', icon: Stethoscope, path: '/doctors' },
    { title: 'Quyên góp', icon: Gift, path: '/donations' },
    { title: 'Yêu cầu hỗ trợ', icon: HandHeart, path: '/assistance' },
  ];

  if (error && !loading) {
    return (
      <Card className="healthcare-card">
        <CardHeader>
          <CardTitle className="healthcare-heading">Lỗi kết nối</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-center">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4 w-full">
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Thống kê nhanh */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Lịch hẹn sắp tới', value: stats.upcoming, icon: Calendar },
          { label: 'Lịch sử khám', value: stats.history, icon: Clock },
          { label: 'Hỗ trợ nhận được', value: stats.support, icon: HandHeart, color: 'text-success' },
          { label: 'Tin nhắn mới', value: stats.messages, icon: MessageCircle },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="healthcare-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color || 'text-primary'}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.label.includes('VNĐ') ? 'trong năm nay' : 'cập nhật mới nhất'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Thao tác nhanh */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Card className="healthcare-card">
          <CardHeader>
            <CardTitle className="healthcare-heading">Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action, i) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-4 text-left justify-start"
                  onClick={() => navigate(action.path)}
                >
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {action.title === 'Đặt lịch khám' && 'Với bác sĩ tình nguyện'}
                      {action.title === 'Tìm bác sĩ' && 'Danh sách chuyên khoa'}
                      {action.title === 'Quyên góp' && 'Xem chiến dịch'}
                      {action.title === 'Yêu cầu hỗ trợ' && 'Tạo yêu cầu y tế'}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lịch hẹn & Hoạt động */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Lịch hẹn */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle className="healthcare-heading">Lịch hẹn sắp tới</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Đang tải...</p>
              ) : appointments.length > 0 ? (
                appointments
                  .filter((apt) => new Date(apt.scheduledTime) > new Date())
                  .slice(0, 3)
                  .map((apt) => (
                    <div key={apt._id} className="flex justify-between items-center border rounded-lg p-4">
                      <div>
                        <p className="font-medium">
                          BS. {apt.doctorId?.userId?.fullName || 'Chưa xác định'}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {apt.appointmentType.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(apt.scheduledTime).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <Badge
                        className={
                          apt.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : apt.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {apt.status === 'confirmed' && 'Đã xác nhận'}
                        {apt.status === 'scheduled' && 'Đã đặt'}
                        {apt.status === 'in_progress' && 'Đang khám'}
                        {apt.status === 'completed' && 'Hoàn thành'}
                        {apt.status === 'cancelled' && 'Đã hủy'}
                      </Badge>
                    </div>
                  ))
              ) : (
                <p className="text-center py-8 text-muted-foreground">Chưa có lịch hẹn</p>
              )}
              <Button variant="outline" className="w-full" onClick={() => navigate('/appointments')}>
                Xem tất cả
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hoạt động gần đây */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle className="healthcare-heading">Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Đang tải...</p>
              ) : notifications.length > 0 ? (
                notifications.slice(0, 5).map((notif) => (
                  <div key={notif._id} className="flex items-start space-x-3 border rounded-lg p-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-sm text-muted-foreground">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    {!notif.read && <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>}
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground">Không có thông báo</p>
              )}
              <Button variant="outline" className="w-full" onClick={() => navigate('/notifications')}>
                Xem tất cả
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <ChatBubble />
    </div>
  );
}