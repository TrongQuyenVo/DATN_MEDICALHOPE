import { motion } from 'framer-motion';
import { Users, Stethoscope, Gift, Building2, TrendingUp, AlertCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { analyticsAPI, partnersAPI, patientsAPI } from '@/lib/api';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DashboardData {
  keyMetrics: {
    totalUsers: number;
    totalDonations: number;
    appointmentsThisMonth: number;
    completionRate: number;
  };
  userDistribution: Array<{ role: string; count: number }>;
  monthlyDonations?: Array<{ month: string; donations: number }>;
  previousMetrics?: {
    totalUsers: number;
    doctors: number;
    donations: number;
    partners: number;
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  // 1. LẤY DỮ LIỆU CHÍNH TỪ /analytics/admin-dashboard
  const {
    data: dashboardData,
    isLoading: loadingMain,
    error: mainError,
  } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => analyticsAPI.getDashboard().then(res => res.data), // Đảm bảo API trả đúng
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
    queryKey: ['new-patients-30days'],
    queryFn: () => patientsAPI.getNewCount(30).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  // 4. PENDING REQUESTS
  const {
    data: pendingData,
    isLoading: loadingPending,
  } = useQuery({
    queryKey: ['pending-counts'],
    queryFn: () => analyticsAPI.getPendingCounts().then(res => res.data),
  });

  // 5. MỤC TIÊU THÁNG

  // 6. HOẠT ĐỘNG GẦN ĐÂY
  const {
    data: activitiesData,
    isLoading: loadingActivities,
  } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => analyticsAPI.getRecentActivities().then(res => res.data),
    refetchInterval: 60_000,
  });

  // Modal state
  const [openActivities, setOpenActivities] = useState(false);

  // XỬ LÝ LỖI
  if (mainError) toast.error('Không thể tải dữ liệu dashboard');
  if (newPatientsError) toast.error('Không thể tải số bệnh nhân mới');

  // LOADING STATE
  if (loadingMain) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Đang tải dữ liệu...</div>
      </div>
    );
  }

  // EMPTY STATE
  if (!dashboardData) {
    return (
      <div className="text-center p-8 text-red-500">
        Không có dữ liệu để hiển thị
      </div>
    );
  }

  // TÍNH TOÁN DỮ LIỆU THỰC TẾ
  const volunteerDoctors = dashboardData.userDistribution.find(u => u.role === 'Bác sĩ')?.count || 0;
  const formatVND = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' VNĐ';
  };
  const partnerCount = partnersData?.pagination?.total || 0;
  const newPatientsCount = newPatientsData?.pagination?.total || 0;

  // === TÍNH CHANGE THỰC TẾ ===
  const prev: NonNullable<DashboardData['previousMetrics']> =
    dashboardData.previousMetrics ?? { totalUsers: 0, doctors: 0, donations: 0, partners: 0 };
  const calculateChange = (current: number, previous: number): string => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  const userChange = calculateChange(dashboardData.keyMetrics.totalUsers, prev.totalUsers || 0);
  const doctorChange = calculateChange(volunteerDoctors, prev.doctors || 0);

  const partnerChange = calculateChange(partnerCount, prev.partners || 0);

  // === 3 BIẾN DỮ LIỆU THỰC TẾ ===
  const pendingRequests = loadingPending ? [] : [
    { type: 'Xác thực bác sĩ', count: pendingData?.doctor || 0, action: () => navigate('/doctors') },
    { type: 'Duyệt yêu cầu hỗ trợ', count: pendingData?.support || 0, action: () => navigate('/assistance') },
    { type: 'Xác minh bệnh nhân', count: pendingData?.patient || 0, action: () => navigate('/patients') },
  ];

  // Quyên góp: tổng hệ thống
  const totalDonations = dashboardData.keyMetrics.totalDonations;
  const donationChange = calculateChange(totalDonations, prev.donations || 0);

  const monthlyTargets = {
    donations: {
      current: totalDonations,
      target: 200_000_000, // Cứng tạm, hoặc sau này backend trả thêm field target
    },
    newPatients: {
      current: newPatientsCount,
      target: 500,
    },
    volunteerDoctors: {
      current: volunteerDoctors,
      target: 200,
    },
  };

  const recentActivities = loadingActivities
    ? []
    : (activitiesData || []).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const displayedActivities = recentActivities.slice(0, 5);
  const hasMore = recentActivities.length > 5;

  // === STATS CARDS – CHANGE THỰC TẾ ===
  const stats = [
    {
      title: 'Tổng người dùng',
      value: dashboardData.keyMetrics.totalUsers.toLocaleString('vi-VN'),
      change: userChange,
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Bác sĩ tình nguyện',
      value: volunteerDoctors.toLocaleString('vi-VN'),
      change: doctorChange,
      icon: Stethoscope,
      color: 'text-secondary',
    },
    {
      title: 'Tổng quyên góp',
      value: `${formatVND(totalDonations)}`,
      change: donationChange,
      icon: Gift,
      color: 'text-success',
    },
    {
      title: 'Tổ chức từ thiện',
      value: loadingPartners ? '...' : partnerCount.toLocaleString('vi-VN'),
      change: partnerChange,
      icon: Building2,
      color: 'text-warning',
    },
  ];

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* === STAT CARDS === */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="healthcare-card hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={stat.change.startsWith('+') ? 'text-success' : 'text-destructive'}>
                    {stat.change}
                  </span>{' '}
                  so với kỳ trước
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* === 3 CỘT === */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* CẦN XỬ LÝ */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-warning" />
                Cần xử lý
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingPending ? (
                <div className="p-6 text-center text-muted-foreground">Đang tải...</div>
              ) : pendingRequests.every(r => r.count === 0) ? (
                <div className="p-6 text-center text-muted-foreground">Không có yêu cầu nào</div>
              ) : (
                pendingRequests.map((r, i) => (
                  <div
                    key={i}
                    onClick={r.action}
                    className="flex justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-medium">{r.type}</div>
                      <div className="text-sm text-muted-foreground">{r.count} yêu cầu</div>
                    </div>
                    <div className="bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {r.count}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* MỤC TIÊU – ĐÃ HOÀN HẢO, KHÔNG CÒN LỖI NỮA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Mục tiêu tháng này
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-7">
              {/* Quyên góp */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold">Quyên góp</span>
                  <span className="font-medium text-muted-foreground">
                    {totalDonations.toLocaleString('vi-VN')} VNĐ / 200.000.000 VNĐ
                  </span>
                </div>
                <Progress
                  value={(totalDonations / 200_000_000) * 100}
                  className="h-3"
                />
                <div className="text-xs text-success font-medium">
                  {((totalDonations / 200_000_000) * 100).toFixed(1)}% hoàn thành
                </div>
              </div>

              {/* Bệnh nhân mới */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold">Bệnh nhân mới</span>
                  <span className="font-medium text-muted-foreground">
                    {newPatientsCount} / 500 người
                  </span>
                </div>
                <Progress value={(newPatientsCount / 500) * 100} className="h-3" />
                <div className="text-xs text-success font-medium">
                  {((newPatientsCount / 500) * 100).toFixed(1)}% hoàn thành
                </div>
              </div>

              {/* Bác sĩ tình nguyện */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold">Bác sĩ tình nguyện</span>
                  <span className="font-medium text-muted-foreground">
                    {volunteerDoctors} / 200 người
                  </span>
                </div>
                <Progress value={(volunteerDoctors / 200) * 100} className="h-3" />
                <div className="text-xs text-success font-medium">
                  {((volunteerDoctors / 200) * 100).toFixed(1)}% hoàn thành
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* QUẢN LÝ */}
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

      {/* HOẠT ĐỘNG GẦN ĐÂY – CHỈ 5 HOẠT ĐỘNG */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <Card className="healthcare-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Hoạt động gần đây</CardTitle>
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpenActivities(true)}
                className="text-primary hover:text-primary/80"
              >
                Xem tất cả
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loadingActivities ? (
                <div className="p-6 text-center text-muted-foreground">Đang tải hoạt động...</div>
              ) : displayedActivities.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">Chưa có hoạt động</div>
              ) : (
                displayedActivities.map((a, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 rounded-lg border bg-card">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${a.status === 'success' ? 'bg-success' :
                        a.status === 'warning' ? 'bg-warning' :
                          'bg-primary'
                        }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{a.message}</div>
                      <div className="text-xs text-muted-foreground">{a.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* MODAL: XEM TẤT CẢ HOẠT ĐỘNG */}
      <Dialog open={openActivities} onOpenChange={setOpenActivities}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl">Tất cả hoạt động hệ thống</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {recentActivities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Chưa có hoạt động nào
              </div>
            ) : (
              recentActivities.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start space-x-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 ${a.status === 'success' ? 'bg-success' :
                      a.status === 'warning' ? 'bg-warning' :
                        'bg-primary'
                      }`}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{a.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">{a.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}