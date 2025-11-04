import { motion } from 'framer-motion';
import {
  Heart,
  Gift,
  Users,
  HandHeart,
  Loader2,
  AlertCircle,
  RefreshCw,
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
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  analyticsAPI,
  assistanceAPI,
  donationsAPI,
  partnersAPI, // <-- Thêm API mới
} from '@/lib/api';

// Types
interface DashboardData {
  totalDonations: number;
  patientsHelped: number;
  pendingRequests: number;
  donationGrowth: number;
  newPatients?: number;
  newRequests?: number;
}

interface PendingRequest {
  id: string;
  patient: string;
  requestType: string;
  amount: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  submittedAt: string;
}

interface RecentDonation {
  id: string;
  donor: string;
  amount: string;
  type: 'money' | 'equipment';
  time: string;
}

export default function CharityAdminDashboard() {
  const navigate = useNavigate();

  // === LẤY DỮ LIỆU TỪ API ===
  const {
    data: dashboardData,
    isLoading: loadingStats,
    error: statsError,
  } = useQuery<DashboardData>({
    queryKey: ['charity-dashboard'],
    queryFn: () => analyticsAPI.getCharityDashboard().then((res) => res.data),
  });

  const {
    data: assistanceData,
    isLoading: loadingAssistance,
    error: assistanceError,
  } = useQuery({
    queryKey: ['pending-assistance'],
    queryFn: () =>
      assistanceAPI.getAll({
        status: 'pending',
        sort: '-createdAt',
        limit: 3,
      }),
  });

  const {
    data: donationData,
    isLoading: loadingDonations,
    error: donationsError,
  } = useQuery({
    queryKey: ['recent-donations'],
    queryFn: () =>
      donationsAPI.getAll({
        sort: '-createdAt',
        limit: 3,
      }),
  });

  // LẤY SỐ LƯỢNG TỔ CHỨC TỪ THIỆN
  const {
    data: partnersData,
    isLoading: loadingPartners,
    error: partnersError,
  } = useQuery({
    queryKey: ['partners-list'],
    queryFn: () => partnersAPI.getAll({ limit: 1 }).then((res) => res.data),
  });

  // === XỬ LÝ DỮ LIỆU ===
  const stats = loadingStats || loadingPartners
    ? []
    : [
      {
        title: 'Tổng quyên góp',
        value: `${dashboardData?.totalDonations.toLocaleString() || 0} VNĐ`,
        change: `+${dashboardData?.donationGrowth || 0}%`,
        icon: Gift,
        color: 'text-success',
      },
      {
        title: 'Bệnh nhân đã hỗ trợ',
        value: dashboardData?.patientsHelped || 0,
        change: `+${dashboardData?.newPatients || 0}`,
        icon: Heart,
        color: 'text-primary',
      },
      {
        title: 'Yêu cầu hỗ trợ',
        value: dashboardData?.pendingRequests || 0,
        change: `+${dashboardData?.newRequests || 0}`,
        icon: HandHeart,
        color: 'text-secondary',
      },
      {
        title: 'Tổ chức từ thiện',
        value: partnersData?.pagination?.total || 0,
        change: '+0',
        icon: Users,
        color: 'text-warning',
      },
    ];

  const pendingAssistance: PendingRequest[] = loadingAssistance
    ? []
    : Array.isArray(assistanceData?.data)
      ? assistanceData.data.map((req: any) => ({
        id: req._id,
        patient: req.patientId?.userId?.fullName || 'Không xác định',
        requestType: getRequestTypeLabel(req.requestType),
        amount: `${req.requestedAmount.toLocaleString()} VNĐ`,
        urgency: req.urgency,
        submittedAt: formatTimeAgo(req.createdAt),
      }))
      : [];

  const recentDonations: RecentDonation[] = loadingDonations
    ? []
    : Array.isArray(donationData?.data)
      ? donationData.data.map((don: any) => ({
        id: don._id,
        donor: don.isAnonymous
          ? 'Ẩn danh'
          : don.userId?.fullName || don.userId?.email || 'Không xác định',
        amount: `${(don.amount || 0).toLocaleString()} VNĐ`,
        type: 'money',
        time: formatTimeAgo(don.createdAt),
      }))
      : [];

  // === HÀM HỖ TRỢ ===
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      case 'low':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'Cực kỳ khẩn cấp';
      case 'high': return 'Khẩn cấp';
      case 'medium': return 'Trung bình';
      case 'low': return 'Bình thường';
      default: return 'Không xác định';
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      medical_treatment: 'Điều trị y tế',
      medication: 'Thuốc men',
      equipment: 'Thiết bị y tế',
      surgery: 'Phẫu thuật',
      emergency: 'Cấp cứu',
      rehabilitation: 'Phục hồi',
      other: 'Khác',
    };
    return map[type] || type;
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    return 'Vừa xong';
  };

  // === COMPONENT NHỎ ===
  const LoadingCard = () => (
    <Card className="healthcare-card">
      <CardHeader className="pb-2">
        <div className="h-5 bg-muted rounded w-32 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 bg-muted rounded w-24 animate-pulse mb-2" />
        <div className="h-3 bg-muted rounded w-20 animate-pulse" />
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

  // === XỬ LÝ LỖI ===
  if (statsError || assistanceError || donationsError || partnersError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-semibold text-destructive">
          Không thể tải dữ liệu
        </h3>
        <p className="text-muted-foreground max-w-md text-center">
          {(statsError || assistanceError || donationsError || partnersError)?.message ||
            'Vui lòng thử lại sau'}
        </p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tải lại trang
        </Button>
      </div>
    );
  }

  // === RENDER GIAO DIỆN ===
  return (
    <div className="space-y-6">
      {/* 1. Tiêu đề + Làm mới */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bảng Điều Khiển Quản Trị</h1>
          <p className="text-muted-foreground">Theo dõi hoạt động từ thiện và xử lý yêu cầu hỗ trợ</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {/* 2. Thẻ thống kê */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {loadingStats || loadingPartners
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
                    <span className={stat.change.includes('+') ? 'text-success' : 'text-destructive'}>
                      {stat.change}
                    </span>{' '}
                    so với tháng trước
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
      </div>

      {/* 3. Yêu cầu + Quyên góp */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Yêu cầu hỗ trợ chờ duyệt */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="healthcare-card border-l-4 border-l-destructive/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="healthcare-heading flex items-center gap-2">
                    <HandHeart className="h-5 w-5 text-destructive" />
                    Yêu cầu hỗ trợ chờ duyệt
                  </CardTitle>
                  <CardDescription>
                    {loadingAssistance ? (
                      <span className="flex items-center text-sm">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Đang tải...
                      </span>
                    ) : (
                      <span className="font-medium text-destructive">
                        {pendingAssistance.length} yêu cầu cần xử lý
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => navigate('/assistance')}>
                  Xem tất cả
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingAssistance ? (
                <LoadingList count={3} />
              ) : pendingAssistance.length === 0 ? (
                <EmptyState icon={HandHeart} message="Không có yêu cầu nào đang chờ duyệt" />
              ) : (
                pendingAssistance.map((request) => (
                  <div
                    key={request.id}
                    className="group border rounded-lg p-4 hover:bg-muted/50 transition-all cursor-pointer"
                    onClick={() => navigate(`/assistance/${request.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <p className="font-semibold text-foreground">{request.patient}</p>
                        <p className="text-sm text-muted-foreground">{request.requestType}</p>
                      </div>
                      <Badge className={getUrgencyColor(request.urgency)}>
                        {getUrgencyLabel(request.urgency)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <span className="font-bold text-success">{request.amount}</span>
                      <span className="text-muted-foreground">{request.submittedAt}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quyên góp gần đây */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="healthcare-card h-full">
            <CardHeader>
              <CardTitle className="healthcare-heading flex items-center gap-2">
                <Gift className="h-5 w-5 text-success" />
                Quyên góp gần đây
              </CardTitle>
              <CardDescription>
                {loadingDonations ? 'Đang tải...' : `${recentDonations.length} khoản mới`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loadingDonations ? (
                  <LoadingList count={3} />
                ) : recentDonations.length === 0 ? (
                  <EmptyState icon={Gift} message="Chưa có quyên góp nào" />
                ) : (
                  recentDonations.map((donation) => (
                    <div
                      key={donation.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-success to-success/80 flex items-center justify-center">
                          <Gift className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{donation.donor}</p>
                          <p className="text-xs text-muted-foreground">Quyên góp tiền</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-success text-sm">{donation.amount}</p>
                        <p className="text-xs text-muted-foreground">{donation.time}</p>
                      </div>
                    </div>
                  ))
                )}
                <Button
                  variant="ghost"
                  className="w-full mt-2 text-sm"
                  onClick={() => navigate('/donations')}
                >
                  Xem tất cả quyên góp
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 4. Thao tác nhanh */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="healthcare-card">
          <CardHeader>
            <CardTitle className="healthcare-heading">Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button
                variant="default"
                className="h-20 flex-col gap-1 btn-healthcare"
                onClick={() => navigate('/assistance')}
              >
                <HandHeart className="h-5 w-5" />
                <span className="text-xs">Duyệt yêu cầu</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-1"
                onClick={() => navigate('/donations')}
              >
                <Gift className="h-5 w-5" />
                <span className="text-xs">Quản lý quyên góp</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-1"
                onClick={() => navigate('/patients')}
              >
                <Heart className="h-5 w-5" />
                <span className="text-xs">Xác minh bệnh nhân</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-1"
                onClick={() => navigate('/charity')}
              >
                <Users className="h-5 w-5" />
                <span className="text-xs">Cập nhật tổ chức</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}