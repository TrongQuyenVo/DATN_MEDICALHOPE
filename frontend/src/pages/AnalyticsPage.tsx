/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, DollarSign, CalendarDays, Target, Award, Gift } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ChatBubble from './ChatbotPage';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { analyticsAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await analyticsAPI.getDashboard();
        const apiData = res.data;

        // === 1. TỔNG DONATIONS ===
        const totalDonations = apiData.monthlyDonations.reduce(
          (sum: number, d: any) => sum + d.donations,
          0
        );

        // === 2. TÍNH % TĂNG TRƯỞNG CHÍNH XÁC THEO T1-T12 ===
        const calcGrowth = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return ((current - previous) / previous) * 100;
        };

        const now = new Date();
        const currentMonthKey = `T${now.getMonth() + 1}`;
        const prevMonthKey = `T${now.getMonth() === 0 ? 12 : now.getMonth()}`;

        // Users
        const currentUsers = apiData.monthlyGrowth.find((d: any) => d.month === currentMonthKey)?.users || 0;
        const prevUsers = apiData.monthlyGrowth.find((d: any) => d.month === prevMonthKey)?.users || 0;
        const usersGrowth = calcGrowth(currentUsers, prevUsers);

        // Donations
        const currentDonations = apiData.monthlyDonations.find((d: any) => d.month === currentMonthKey)?.donations || 0;
        const prevDonations = apiData.monthlyDonations.find((d: any) => d.month === prevMonthKey)?.donations || 0;
        const donationsGrowth = calcGrowth(currentDonations, prevDonations);

        // Appointments
        const appointmentsThisMonth = apiData.keyMetrics.appointmentsThisMonth || 0;
        const appointmentsLastMonth = apiData.keyMetrics.appointmentsLastMonth || 0;
        const appointmentsGrowth = calcGrowth(appointmentsThisMonth, appointmentsLastMonth);

        // Completion Rate
        const completionRate = apiData.keyMetrics.completionRate || 0;
        const prevCompletionRate = apiData.keyMetrics.prevCompletionRate || 0;
        const completionGrowth = calcGrowth(completionRate, prevCompletionRate);

        // === 3. DONATION CATEGORIES % ===
        const totalCat = apiData.donationCategories.reduce((sum: number, c: any) => sum + c.amount, 0);
        const donationCategories = apiData.donationCategories.map((c: any) => ({
          ...c,
          percentage: totalCat > 0 ? Math.round((c.amount / totalCat) * 100) : 0,
        }));

        // === 4. MONTHLY GROWTH GỘP ===
        const months = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
        const monthlyGrowth = months.map((m) => ({
          month: m,
          users: apiData.monthlyGrowth.find((d: any) => d.month === m)?.users || 0,
          donations: apiData.monthlyDonations.find((d: any) => d.month === m)?.donations || 0,
          appointments: 0,
        }));

        setData({
          ...apiData,
          totalDonations,
          donationCategories,
          monthlyGrowth,
          growth: {
            users: usersGrowth,
            donations: donationsGrowth,
            appointments: appointmentsGrowth,
            completion: completionGrowth,
          },
          keyMetrics: {
            totalUsers: apiData.keyMetrics.totalUsers,
            // Quyên góp của THÁNG HIỆN TẠI
            currentMonthDonations: currentDonations,
            appointmentsThisMonth,
            completionRate,
          },
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

  const formatGrowth = (value: number): { formatted: string; isPositive: boolean } => {
    if (isNaN(value)) return { formatted: '0.0%', isPositive: true };
    const formatted = `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    return { formatted, isPositive: value >= 0 };
  };

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
            {/* 1. Tổng người dùng */}
            <div className="flex items-center text-xs mt-1">
              {data.growth.users >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={data.growth.users >= 0 ? 'text-success' : 'text-red-500'}>
                {formatGrowth(data.growth.users).formatted}
              </span>
              <span className="text-muted-foreground ml-1">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>

        <Card className="healthcare-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quyên góp tháng này</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {data.keyMetrics.currentMonthDonations.toLocaleString('vi-VN')} VNĐ
            </div>
            {/* 2. Quyên góp tháng này (so sánh với tháng trước) */}
            <div className="flex items-center text-xs mt-1">
              {data.growth.donations >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={data.growth.donations >= 0 ? 'text-success' : 'text-red-500'}>
                {formatGrowth(data.growth.donations).formatted}
              </span>
              <span className="text-muted-foreground ml-1">so với tháng trước</span>
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
            <div className="flex items-center text-xs mt-1">
              {data.growth.appointments >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={data.growth.appointments >= 0 ? 'text-success' : 'text-red-500'}>
                {formatGrowth(data.growth.appointments).formatted}
              </span>
              <span className="text-muted-foreground ml-1">so với tháng trước</span>
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
            <div className="flex items-center text-xs mt-1">
              {data.growth.completion >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={data.growth.completion >= 0 ? 'text-success' : 'text-red-500'}>
                {formatGrowth(data.growth.completion).formatted}
              </span>
              <span className="text-muted-foreground ml-1">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
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
                <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
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
        <Card className="healthcare-card">
          <CardHeader>
            <CardTitle className="healthcare-heading flex items-center gap-2">
              <Gift className="h-5 w-5 text-success" />
              Quyên góp theo tháng
            </CardTitle>
            <CardDescription>
              Tổng số tiền quyên góp từng tháng (đơn vị: VNĐ)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={data.monthlyGrowth}
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" />

                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 13 }}
                  stroke="hsl(var(--muted-foreground))"
                />

                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(value) => {
                    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}T`;
                    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
                    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
                    return value.toLocaleString('vi-VN');
                  }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                  formatter={(value: number) => [
                    <span className="font-bold text-success">
                      {value.toLocaleString('vi-VN')} VNĐ
                    </span>,
                    "Tổng quyên góp"
                  ]}
                  labelFormatter={(label) => `Tháng ${label}`}
                />

                <Line
                  type="monotone"
                  dataKey="donations"
                  stroke="hsl(var(--success))"
                  strokeWidth={3}
                  dot={{
                    fill: "hsl(var(--success))",
                    strokeWidth: 2,
                    r: 6,
                  }}
                  activeDot={{
                    r: 8,
                    stroke: "hsl(var(--success))",
                    strokeWidth: 3,
                    fill: "white",
                  }}
                  animationDuration={1200}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Tổng hợp nhanh bên dưới biểu đồ */}
            <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-sm">
              <div className="text-muted-foreground">
                Tổng quyên góp năm nay
              </div>
              <div className="font-bold text-lg text-success">
                {data.totalDonations.toLocaleString('vi-VN')} VNĐ
              </div>
            </div>
          </CardContent>
        </Card>

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
      {!isAdmin && <ChatBubble />}
    </motion.div>
  );
}