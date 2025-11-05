/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import { TrendingUp, Users, Heart, Activity, CalendarDays, DollarSign, Target, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ChatBubble from './ChatbotPage';
import ScrollToTop from '@/components/layout/ScrollToTop';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { analyticsAPI } from '@/lib/api';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await analyticsAPI.getDashboard();
        const apiData = res.data;

        // Tính % cho donationCategories
        const totalCat = apiData.donationCategories.reduce((sum: number, c: any) => sum + c.amount, 0);
        apiData.donationCategories = apiData.donationCategories.map((c: any) => ({
          ...c,
          percentage: totalCat > 0 ? Math.round((c.amount / totalCat) * 100) : 0
        }));

        // Gộp dữ liệu tăng trưởng (thêm appointments nếu cần, hiện tại dùng 0)
        const months = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
        const monthlyGrowth = months.map((m, i) => {
          const userItem = apiData.monthlyGrowth.find((d: any) => d.month === m) || { users: 0 };
          const donationItem = apiData.monthlyDonations.find((d: any) => d.month === m) || { donations: 0 };
          return {
            month: m,
            users: userItem.users,
            donations: donationItem.donations,
            appointments: 0 // Có thể tính thêm từ API nếu mở rộng
          };
        });

        setData({
          ...apiData,
          monthlyGrowth,
          keyMetrics: {
            totalUsers: apiData.keyMetrics.totalUsers,
            totalDonations: apiData.keyMetrics.totalDonations,
            appointmentsThisMonth: apiData.keyMetrics.appointmentsThisMonth,
            completionRate: apiData.keyMetrics.completionRate
          }
        });
      } catch (error) {
        toast.error('Không thể tải dữ liệu thống kê');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center p-8">Đang tải dữ liệu...</div>;
  if (!data) return <div className="text-center p-8 text-red-500">Không có dữ liệu</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="healthcare-heading text-3xl font-bold">Thống kê & Báo cáo</h1>
        <p className="healthcare-subtitle">Phân tích dữ liệu và hiệu suất hệ thống</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="healthcare-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{data.keyMetrics.totalUsers}</div>
            <div className="flex items-center text-xs text-success mt-1">
              <TrendingUp className="mr-1 h-3 w-3" />
              +12% so với tháng trước {/* Có thể tính động nếu cần */}
            </div>
          </CardContent>
        </Card>

        <Card className="healthcare-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng quyên góp</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{(data.keyMetrics.totalDonations / 1e9).toFixed(2)}B VNĐ</div>
            <div className="flex items-center text-xs text-success mt-1">
              <TrendingUp className="mr-1 h-3 w-3" />
              +8.5% so với tháng trước {/* Có thể tính động */}
            </div>
          </CardContent>
        </Card>

        <Card className="healthcare-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lịch hẹn tháng này</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{data.keyMetrics.appointmentsThisMonth}</div>
            <div className="flex items-center text-xs text-success mt-1">
              <TrendingUp className="mr-1 h-3 w-3" />
              +15% so với tháng trước {/* Có thể tính động */}
            </div>
          </CardContent>
        </Card>

        <Card className="healthcare-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ hoàn thành</CardTitle>
            <Target className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{data.keyMetrics.completionRate}%</div>
            <div className="flex items-center text-xs text-success mt-1">
              <TrendingUp className="mr-1 h-3 w-3" />
              +2.1% so với tháng trước {/* Có thể tính động */}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <Card className="healthcare-card">
          <CardHeader>
            <CardTitle className="healthcare-heading">Tăng trưởng người dùng</CardTitle>
            <CardDescription>Thống kê người dùng mới theo tháng</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Distribution Pie Chart */}
        <Card className="healthcare-card">
          <CardHeader>
            <CardTitle className="healthcare-heading">Phân bố người dùng</CardTitle>
            <CardDescription>Thống kê theo vai trò</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.userDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {data.userDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {data.userDistribution.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.role}</span>
                  </div>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Donations Chart */}
        <Card className="healthcare-card">
          <CardHeader>
            <CardTitle className="healthcare-heading">Quyên góp theo tháng</CardTitle>
            <CardDescription>Thống kê số tiền quyên góp (VNĐ)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString('vi-VN')} VNĐ`, 'Quyên góp']} />
                <Line
                  type="monotone"
                  dataKey="donations"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Appointments */}
        <Card className="healthcare-card">
          <CardHeader>
            <CardTitle className="healthcare-heading">Lịch hẹn trong tuần</CardTitle>
            <CardDescription>Thống kê lịch hẹn và hoàn thành</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.weeklyAppointments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="hsl(var(--primary))" name="Tổng lịch hẹn" />
                <Bar dataKey="completed" fill="hsl(var(--success))" name="Đã hoàn thành" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Donation Categories */}
        <Card className="healthcare-card">
          <CardHeader>
            <CardTitle className="healthcare-heading">Phân loại quyên góp</CardTitle>
            <CardDescription>Thống kê theo mục đích sử dụng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.donationCategories.map((category: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category.category}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {category.amount.toLocaleString('vi-VN')} VNĐ
                    </span>
                    <Badge variant="secondary">{category.percentage}%</Badge>
                  </div>
                </div>
                <Progress value={category.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Doctors */}
        <Card className="healthcare-card">
          <CardHeader>
            <CardTitle className="healthcare-heading">Bác sĩ tiêu biểu</CardTitle>
            <CardDescription>Thống kê theo số lượng lịch hẹn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.topDoctors.map((doctor: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">{doctor.name}</div>
                    <div className="text-sm text-muted-foreground">{doctor.specialty}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{doctor.appointments} lịch hẹn</div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Award className="mr-1 h-3 w-3" />
                    {doctor.rating}/5
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <ChatBubble />
      <ScrollToTop />
    </motion.div>
  );
}