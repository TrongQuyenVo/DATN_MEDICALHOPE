/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  Activity,
  Loader2,
  AlertCircle,
  RefreshCw,
  HandHeart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { appointmentsAPI, doctorsAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Login check moved below so hooks (useQuery) are always called in the same order.

  // === 1. Lấy hồ sơ bác sĩ
  const {
    data: doctorProfile,
    isLoading: loadingProfile,
    error: profileError,
  } = useQuery({
    queryKey: ['doctor-profile', user.id],
    queryFn: () => doctorsAPI.getProfile().then(res => res.data),
    enabled: !!user.id,
  });

  // === 2. Lấy tất cả lịch hẹn
  const {
    data: appointmentsResponse,
    isLoading: loadingAppointments,
    error: appointmentsError,
  } = useQuery({
    queryKey: ['doctor-appointments-all', user.id],
    queryFn: () =>
      appointmentsAPI
        .getAll({ doctorId: user.id })
        .then(res => {
          const data = res.data;
          if (Array.isArray(data)) return data;
          if (data?.appointments) return data.appointments;
          if (data?.data) return data.data;
          return [];
        }),
    enabled: !!user.id,
  });

  const allAppointments = Array.isArray(appointmentsResponse) ? appointmentsResponse : [];

  // === Tính toán thống kê
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const todayAppointments = allAppointments.filter((apt: any) => {
    if (!apt?.scheduledTime) return false;
    const aptDate = new Date(apt.scheduledTime);
    return format(aptDate, 'yyyy-MM-dd') === todayStr && ['confirmed', 'scheduled'].includes(apt.status);
  });

  // === Nếu chưa đăng nhập
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-semibold">Vui lòng đăng nhập</h3>
        <p className="text-muted-foreground">Bạn cần đăng nhập để xem dashboard bác sĩ.</p>
      </div>
    );
  }

  // === Tính toán thống kê

  const weekAppointments = allAppointments.filter((apt: any) => {
    if (!apt?.scheduledTime) return false;
    const aptDate = new Date(apt.scheduledTime);
    return (
      isWithinInterval(aptDate, { start: weekStart, end: weekEnd }) &&
      ['confirmed', 'scheduled'].includes(apt.status)
    );
  });

  // === Thống kê
  const stats = loadingProfile || loadingAppointments
    ? []
    : [
      {
        title: 'Bệnh nhân hôm nay',
        value: todayAppointments.length,
        change: `+2`,
        icon: Users,
        color: 'text-primary',
      },
      {
        title: 'Lịch hẹn tuần này',
        value: weekAppointments.length,
        change: `+5`,
        icon: Calendar,
        color: 'text-secondary',
      },
      {
        title: 'Giờ tình nguyện',
        value: doctorProfile?.volunteerHours || 0,
        change: `+12`,
        icon: Clock,
        color: 'text-success',
      },
      {
        title: 'Bệnh nhân đã khám',
        value: doctorProfile?.totalPatients || 0,
        change: `+18`,
        icon: TrendingUp,
        color: 'text-warning',
      },
    ];

  // === Xử lý lỗi
  if (profileError || appointmentsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-semibold text-destructive">Không thể tải dữ liệu</h3>
        <p className="text-muted-foreground max-w-md text-center">
          {(profileError || appointmentsError)?.message || 'Vui lòng thử lại sau'}
        </p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tải lại trang
        </Button>
      </div>
    );
  }

  // === Component con
  const LoadingCard = () => (
    <Card className="healthcare-card">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-24 rounded mb-2" />
        <Skeleton className="h-3 w-20 rounded" />
      </CardContent>
    </Card>
  );

  const LoadingList = ({ count }: { count: number }) => (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4 animate-pulse">
          <div className="h-5 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      ))}
    </div>
  );

  const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => (
    <div className="text-center py-8 text-muted-foreground">
      <Icon className="h-10 w-10 mx-auto mb-3 text-muted" />
      <p className="text-sm">{message}</p>
    </div>
  );

  // === GIAO DIỆN
  return (
    <div className="space-y-6">
      {/* 1. Tiêu đề + Làm mới */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {/* 2. Thẻ thống kê */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {(loadingProfile || loadingAppointments)
          ? Array(4).fill(0).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <LoadingCard />
            </motion.div>
          ))
          : stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="healthcare-card hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-success">{stat.change}</span> so với tuần trước
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
      </div>

      {/* 3. Lịch khám + Hoạt động gần đây + Tác động */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* CỘT TRÁI: Lịch khám + Hoạt động gần đây */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Lịch khám hôm nay */}
          <Card className="healthcare-card border-l-4 border-l-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="healthcare-heading flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Lịch khám hôm nay
                  </CardTitle>
                  <CardDescription>
                    {format(today, "EEEE, dd 'tháng' MM 'năm' yyyy", { locale: vi })}
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => navigate('/appointments')}>
                  Xem tất cả
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingAppointments ? (
                <LoadingList count={3} />
              ) : todayAppointments.length === 0 ? (
                <EmptyState icon={Calendar} message="Không có lịch hẹn nào hôm nay" />
              ) : (
                todayAppointments.map((apt: any) => (
                  <div
                    key={apt._id}
                    className="group border rounded-lg p-4 hover:bg-muted/50 transition-all cursor-pointer"
                    onClick={() => navigate(`/appointments/${apt._id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-lg text-primary">
                          {format(new Date(apt.scheduledTime), 'HH:mm')}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {apt.patientId?.userId?.fullName || 'Bệnh nhân không xác định'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {apt.appointmentType === 'consultation' ? 'Khám tổng quát' : 'Tái khám'}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          apt.status === 'confirmed'
                            ? 'bg-success text-success-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }
                      >
                        {apt.status === 'confirmed' ? 'Đã xác nhận' : 'Đã đặt lịch'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* HOẠT ĐỘNG GẦN ĐÂY – NHỎ GỌN, DƯỚI LỊCH HẸN */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <Card className="healthcare-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    Hoạt động gần đây
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => navigate('/activity')}
                  >
                    Xem tất cả
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loadingAppointments ? (
                  <LoadingList count={2} />
                ) : allAppointments.length === 0 ? (
                  <EmptyState icon={Activity} message="Chưa có hoạt động nào" />
                ) : (
                  <div className="space-y-2 text-sm">
                    {allAppointments
                      .filter((apt: any) => ['confirmed', 'scheduled', 'completed'].includes(apt.status))
                      .sort((a: any, b: any) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime())
                      .slice(0, 2)
                      .map((apt: any) => (
                        <div
                          key={apt._id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                            <span className="font-medium">
                              {apt.patientId?.userId?.fullName || 'Bệnh nhân'}
                            </span>
                            <span className="text-muted-foreground">
                              {apt.status === 'completed' ? 'đã khám' : 'đặt lịch'}
                            </span>
                          </div>
                          <span className="text-muted-foreground">
                            {format(new Date(apt.scheduledTime), 'HH:mm')}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* CỘT PHẢI: Tác động + Thao tác nhanh */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-6"
        >
          {/* Tác động tình nguyện */}
          <Card className="healthcare-card h-50">
            <CardHeader>
              <CardTitle className="healthcare-heading flex items-center gap-2">
                <HandHeart className="h-5 w-5 text-success" />
                Tác động tình nguyện
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingProfile ? (
                <>
                  <Skeleton className="h-10 w-20 mx-auto" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                  <Skeleton className="h-10 w-20 mx-auto" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-warning mb-1">
                      {doctorProfile?.totalPatients || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Bệnh nhân đã hỗ trợ</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success mb-1">
                      {doctorProfile?.volunteerHours || 0} giờ
                    </div>
                    <div className="text-sm text-muted-foreground">Thời gian tình nguyện</div>
                  </div>

                  {/* Chỉ hiện khi > 50 giờ */}
                  {(doctorProfile?.volunteerHours || 0) > 50 && (
                    <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
                      <div className="text-sm font-medium text-success">
                        Bác sĩ tình nguyện xuất sắc tháng này!
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Thao tác nhanh */}
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle className="healthcare-heading text-sm">Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="justify-start btn-healthcare"
                  onClick={() => navigate('/appointments')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Quản lý lịch hẹn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => navigate('/patients')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Danh sách bệnh nhân
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => navigate('/profile')}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Cập nhật hồ sơ
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}