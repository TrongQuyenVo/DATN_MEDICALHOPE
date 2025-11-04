import { motion } from 'framer-motion';
import { Users, Stethoscope, Gift, Building2, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { analyticsAPI, partnersAPI, patientsAPI } from '@/lib/api'; // ĐÃ CÓ

interface DashboardData {
  keyMetrics: {
    totalUsers: number;
    totalDonations: number;
    appointmentsThisMonth: number;
    completionRate: number;
  };
  userDistribution: Array<{ role: string; count: number }>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  // 1. LẤY DỮ LIỆU CHÍNH TỪ /analytics/dashboard
  const {
    data: dashboardData,
    isLoading: loadingMain,
    error: mainError,
  } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: () => analyticsAPI.getDashboard().then(res => res.data), // ĐÃ ĐÚNG
  });

  // 2. LẤY SỐ LƯỢNG TỔ CHỨC TỪ THIỆN
  const {
    data: partnersData,
    isLoading: loadingPartners,
  } = useQuery({
    queryKey: ['partners-count'],
    queryFn: () => partnersAPI.getAll({ limit: 1 }).then(res => res.data),
  });

  // 3. LẤY SỐ LƯỢNG BỆNH NHÂN MỚI TRONG 30 NGÀY
  const {
    data: newPatientsData,
    isLoading: loadingNewPatients,
    error: newPatientsError,
  } = useQuery({
    queryKey: ['new-patients-count', 30],
    queryFn: () => patientsAPI.getNewCount(30).then(res => res.data),
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });

  if (newPatientsError) {
    toast.error('Không thể tải số bệnh nhân mới');
  }

  // Xử lý lỗi
  if (mainError) toast.error('Không thể tải dữ liệu dashboard');

  if (loadingMain) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center p-8 text-red-500">
        Không có dữ liệu để hiển thị
      </div>
    );
  }

  const volunteerDoctors = dashboardData.userDistribution.find(u => u.role === 'Bác sĩ')?.count || 0;
  const totalDonationsM = (dashboardData.keyMetrics.totalDonations / 1e6).toFixed(0);

  const stats = [
    {
      title: 'Tổng người dùng',
      value: dashboardData.keyMetrics.totalUsers.toLocaleString(),
      change: '+12.5%',
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Bác sĩ tình nguyện',
      value: volunteerDoctors,
      change: '+8.2%',
      icon: Stethoscope,
      color: 'text-secondary',
    },
    {
      title: 'Quyên góp tháng này',
      value: `${totalDonationsM}M VNĐ`,
      change: '+15.3%',
      icon: Gift,
      color: 'text-success',
    },
    {
      title: 'Tổ chức từ thiện',
      value: loadingPartners ? '...' : (partnersData?.pagination?.total || 0),
      change: '+2',
      icon: Building2,
      color: 'text-warning',
    },
  ];

  // ... phần còn lại giữ nguyên (pendingRequests, monthlyTargets, recentActivities, return JSX)
  const pendingRequests = [
    { type: 'Xác thực bác sĩ', count: 8, action: () => navigate('/doctors') },
    { type: 'Duyệt yêu cầu hỗ trợ', count: 12, action: () => navigate('/assistance') },
    { type: 'Xác minh bệnh nhân', count: 5, action: () => navigate('/patients') },
  ];

  const monthlyTargets = {
    donations: { current: parseFloat(totalDonationsM), target: 200 },
    newPatients: {
      current: loadingNewPatients
        ? 0
        : (newPatientsData?.pagination?.total || 0),
      target: 500
    },
    volunteerDoctors: { current: volunteerDoctors, target: 200 },
  };

  const recentActivities = [
    { message: `${dashboardData.keyMetrics.totalUsers} người dùng đang hoạt động`, time: 'Vừa xong', status: 'info' },
    { message: `Nhận ${totalDonationsM}M VNĐ quyên góp tháng này`, time: '1 giờ trước', status: 'success' },
    { message: `12 yêu cầu hỗ trợ cần duyệt`, time: '2 giờ trước', status: 'warning' },
    { message: 'Hệ thống ổn định', time: '1 ngày trước', status: 'success' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="healthcare-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-success">{stat.change}</span> từ tháng trước
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 3 cột + hoạt động */}
      {/* ... giữ nguyên phần JSX còn lại */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cần xử lý */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-warning" />
                Cần xử lý
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingRequests.map((r, i) => (
                <div key={i} className="flex justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={r.action}>
                  <div>
                    <div className="font-medium">{r.type}</div>
                    <div className="text-sm text-muted-foreground">{r.count} yêu cầu</div>
                  </div>
                  <div className="bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {r.count}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Mục tiêu */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="healthcare-card">
            <CardHeader><CardTitle>Mục tiêu tháng này</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {[
                { title: 'Quyên góp', ...monthlyTargets.donations, unit: 'M VNĐ' },
                { title: 'Bệnh nhân mới', ...monthlyTargets.newPatients, unit: 'người' },
                { title: 'Bác sĩ tình nguyện', ...monthlyTargets.volunteerDoctors, unit: 'người' },
              ].map((t, i) => {
                const progress = (t.current / t.target) * 100;
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{t.title}</span>
                      <span className="text-sm text-muted-foreground">{t.current}/{t.target} {t.unit}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="text-xs text-muted-foreground">{progress.toFixed(1)}% hoàn thành</div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quản lý */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
          <Card className="healthcare-card">
            <CardHeader><CardTitle>Quản lý hệ thống</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start btn-healthcare" onClick={() => navigate('/users')}>
                <Users className="mr-2 h-4 w-4" /> Quản lý người dùng
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/partners')}>
                <Building2 className="mr-2 h-4 w-4" /> Tổ chức từ thiện
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/donations')}>
                <Gift className="mr-2 h-4 w-4" /> Quản lý quyên góp
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/analytics')}>
                <TrendingUp className="mr-2 h-4 w-4" /> Thống kê & Báo cáo
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Hoạt động gần đây */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <Card className="healthcare-card">
          <CardHeader><CardTitle>Hoạt động gần đây</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((a, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <div className={`w-2 h-2 rounded-full mt-2 ${a.status === 'success' ? 'bg-success' : a.status === 'warning' ? 'bg-warning' : 'bg-primary'}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{a.message}</div>
                    <div className="text-xs text-muted-foreground">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}