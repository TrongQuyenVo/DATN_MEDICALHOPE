import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Stethoscope, DollarSign, FileText, Calendar,
  Heart, Download, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/stores/authStore';
import { assistanceAPI } from '@/lib/api';
import DonationForm from '@/components/form/DonationForm';
import toast from 'react-hot-toast';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';
import NavHeader from '@/components/layout/NavHeader';
import Footer from '@/components/layout/Footer';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface AssistanceRequest {
  _id: string;
  patientId: {
    userId: {
      _id: string;
      fullName: string;
      phone: string;
      profile?: {
        dateOfBirth?: string;
        address?: string;
      };
    };
  };
  requestType: string;
  title: string;
  description: string;
  medicalCondition: string;
  requestedAmount: number;
  raisedAmount: number;
  urgency: string;
  contactPhone: string;
  status: string;
  attachments?: Array<{
    filename: string;
    path: string;
    size: number;
  }>;
  createdAt: string;
  approvedBy?: {
    fullName: string;
  };
}

const calculateAge = (dateOfBirth?: string): string => {
  if (!dateOfBirth) return 'Chưa cung cấp';
  const birth = new Date(dateOfBirth);
  if (isNaN(birth.getTime())) return 'Không hợp lệ';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} tuổi`;
};

export default function AssistanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [assistance, setAssistance] = useState<AssistanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data } = await assistanceAPI.getById(id);
        setAssistance(data.data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Không thể tải chi tiết yêu cầu');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    try {
      await assistanceAPI.updateStatus(id, { status: 'approved' });
      toast.success('Đã duyệt yêu cầu!');
      const { data } = await assistanceAPI.getById(id);
      setAssistance(data.data);
    } catch {
      toast.error('Lỗi khi duyệt');
    }
  };

  const handleReject = async () => {
    if (!id) return;
    try {
      await assistanceAPI.updateStatus(id, { status: 'rejected' });
      toast.success('Đã từ chối yêu cầu!');
      const { data } = await assistanceAPI.getById(id);
      setAssistance(data.data);
    } catch {
      toast.error('Lỗi khi từ chối');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!assistance) {
    return (
      <div className="text-center py-32 text-red-600">
        <AlertCircle className="h-16 w-16 mx-auto mb-4" />
        <p className="text-xl">Không tìm thấy yêu cầu hỗ trợ</p>
      </div>
    );
  }

  const progress = (assistance.raisedAmount / assistance.requestedAmount) * 100;
  const remaining = assistance.requestedAmount - assistance.raisedAmount;
  const isAdmin = ['admin'].includes(user?.role || '');
  const isCharityAdmin = user?.role === 'charity_admin';
  const isPatient = user?._id === assistance.patientId.userId._id; // Người tạo yêu cầu

  const getStatusConfig = () => {
    const map: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
      pending: { label: 'Chờ duyệt', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: <AlertCircle className="h-4 w-4" /> },
      approved: { label: 'Đã duyệt', color: 'text-green-600', bg: 'bg-green-50', icon: <CheckCircle2 className="h-4 w-4" /> },
      rejected: { label: 'Từ chối', color: 'text-red-600', bg: 'bg-red-50', icon: <XCircle className="h-4 w-4" /> },
      in_progress: { label: 'Đang thực hiện', color: 'text-blue-600', bg: 'bg-blue-50', icon: <Stethoscope className="h-4 w-4" /> },
      completed: { label: 'Hoàn thành', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 className="h-4 w-4" /> },
    };
    return map[assistance.status] || map.pending;
  };

  const getUrgencyConfig = () => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      low: { label: 'Bình thường', bg: 'bg-gray-100', text: 'text-gray-700' },
      medium: { label: 'Trung bình', bg: 'bg-yellow-100', text: 'text-yellow-700' },
      high: { label: 'Khẩn cấp', bg: 'bg-orange-100', text: 'text-orange-700' },
      critical: { label: 'Rất khẩn cấp', bg: 'bg-red-100', text: 'text-red-700' },
    };
    return map[assistance.urgency] || map.low;
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
  };

  // Điều kiện ủng hộ: approved + (chưa đăng nhập HOẶC charity_admin) + KHÔNG phải người tạo
  const canDonate = assistance.status === 'approved' && !isPatient && (
    !user || isCharityAdmin
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-b from-background to-muted/30"
      >
        <div className={`container mx-auto px-4 ${user ? '' : 'py-16'} max-w-5xl`}>

          {/* HEADER & FOOTER khi chưa đăng nhập */}
          {!user && <NavHeader />}
          <div className="mb-2">
            <Button
              variant="ghost"
              onClick={() => {
                if (!user) {
                  navigate('/'); // Chưa đăng nhập → Landing Page
                } else {
                  navigate('/assistance'); // Đã đăng nhập → Trang hỗ trợ
                }
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
              Quay lại
            </Button>
          </div>

          {/* TIÊU ĐỀ + TRẠNG THÁI */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {assistance.title}
            </h1>
            <div className="flex flex-wrap justify-center gap-3">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getStatusConfig().bg} ${getStatusConfig().color}`}>
                {getStatusConfig().icon}
                <span className="font-medium">{getStatusConfig().label}</span>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getUrgencyConfig().bg} ${getUrgencyConfig().text}`}>
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">{getUrgencyConfig().label}</span>
              </div>
            </div>
          </motion.div>

          <Separator className="mb-8" />

          {/* NỘI DUNG CHÍNH */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* CỘT TRÁI */}
            <div className="lg:col-span-2 space-y-8">

              {/* Thông tin bệnh nhân */}
              <Card className="overflow-hidden border-2 shadow-lg">
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <User className="h-6 w-6 text-primary" />
                    Thông tin bệnh nhân
                  </h2>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Họ và tên</p>
                      <p className="text-lg font-semibold">{assistance.patientId.userId.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tuổi</p>
                      <p className="text-lg font-semibold">{calculateAge(assistance.patientId.userId.profile?.dateOfBirth)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Địa chỉ</p>
                      <p className="text-lg font-medium">{assistance.patientId.userId.profile?.address || 'Chưa cung cấp'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Liên hệ</p>
                      <p className="text-lg font-medium">{assistance.contactPhone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tài chính */}
              <Card className="overflow-hidden border-2 shadow-lg">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <DollarSign className="h-6 w-6" />
                    Tình hình quyên góp
                  </h2>
                </div>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-lg">
                      <span>Cần hỗ trợ</span>
                      <span className="font-bold">{formatVND(assistance.requestedAmount)}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span>Đã quyên góp</span>
                      <span className="font-bold text-green-600">{formatVND(assistance.raisedAmount)}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span>Còn thiếu</span>
                      <span className="font-bold text-red-600">{formatVND(Math.max(0, remaining))}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Progress value={progress} className="h-4" />
                    <p className="text-center font-semibold text-lg">
                      {progress.toFixed(1)}% hoàn thành
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Mô tả */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    Tình trạng bệnh lý
                  </h3>
                  <p className="text-foreground font-medium mb-3">{assistance.medicalCondition}</p>
                  <Separator className="my-4" />
                  <h3 className="text-xl font-bold mb-3">Mô tả chi tiết</h3>
                  <ScrollArea className="h-40 rounded-lg border p-4 bg-muted/50">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {assistance.description}
                    </p>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* CỘT PHẢI */}
            <div className="space-y-8">

              {/* Tài liệu */}
              {assistance.attachments && assistance.attachments.length > 0 && (
                <Card className="border-2 shadow-lg">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-lg">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <FileText className="h-6 w-6" />
                      Tài liệu đính kèm
                    </h3>
                  </div>
                  <CardContent className="p-6">
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {assistance.attachments.map((file, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium truncate">{file.filename}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <a
                              href={`${API_SERVER}${file.path}`}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium"
                            >
                              <Download className="h-4 w-4" />
                              Tải
                            </a>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Hành động */}
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-bold mb-4">Hành động</h3>

                  {/* ADMIN: Duyệt / Từ chối */}
                  {isAdmin && assistance.status === 'pending' && (
                    <div className="space-y-3">
                      <Button
                        onClick={handleApprove}
                        className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                      >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Duyệt yêu cầu
                      </Button>
                      <Button
                        onClick={handleReject}
                        variant="destructive"
                        className="w-full text-lg py-6"
                      >
                        <XCircle className="mr-2 h-5 w-5" />
                        Từ chối
                      </Button>
                    </div>
                  )}

                  {/* ỦNG HỘ: Chỉ hiện cho guest + charity_admin + KHÔNG phải người tạo */}
                  {canDonate && (
                    <Button
                      onClick={() => setShowDonationForm(true)}
                      className="w-full bg-red-500 hover:bg-red-600 text-lg py-6"
                    >
                      <Heart className="mr-2 h-5 w-5" />
                      Ủng hộ ngay
                    </Button>
                  )}

                  {/* Người tạo yêu cầu hoặc người dùng thường: chỉ xem */}
                  {(isPatient || (user && !isCharityAdmin && !isAdmin)) && !canDonate && (
                    <div className="text-center text-muted-foreground py-4">
                      <p className="text-sm">Bạn có thể theo dõi tiến độ quyên góp.</p>
                    </div>
                  )}

                  {/* HOÀN THÀNH */}
                  {assistance.status === 'completed' && (
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                      <p className="font-semibold text-emerald-700">Đã hoàn thành!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lịch sử */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Lịch sử
                  </h3>
                  <div className="text-sm space-y-2">
                    <p>
                      <span className="text-muted-foreground">Tạo lúc:</span>{' '}
                      <span className="font-medium">
                        {new Date(assistance.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </p>
                    {assistance.approvedBy && (
                      <p>
                        <span className="text-muted-foreground">Duyệt bởi:</span>{' '}
                        <span className="font-medium">{assistance.approvedBy.fullName}</span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MODAL ỦNG HỘ */}
      {canDonate && (
        <DonationForm
          open={showDonationForm}
          onOpenChange={setShowDonationForm}
          assistanceId={assistance._id}
        />
      )}

      <ScrollToTop />
      <ChatBubble />

      {/* FOOTER khi chưa đăng nhập */}
      {!user && <Footer />}
    </>
  );
}