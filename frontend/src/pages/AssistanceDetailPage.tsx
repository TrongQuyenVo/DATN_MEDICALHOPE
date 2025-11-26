/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Stethoscope, DollarSign, FileText, Calendar,
  Heart, Download, AlertCircle, CheckCircle2, XCircle, ArrowLeft, Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { assistanceAPI } from '@/lib/api';
import DonationForm from '@/components/form/DonationForm';
import toast from 'react-hot-toast';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';

interface AssistanceRequest {
  _id: string;
  patientId: {
    userId: {
      _id: string;
      fullName: string;
      phone: string;
      profile?: { dateOfBirth?: string; address?: string };
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
  attachments?: Array<{ filename: string; path: string; size: number }>;
  createdAt: string;
  approvedBy?: { fullName: string };
}

// ẨN DANH
const anonymizeName = (name: string) => `Bệnh nhân ${name.charAt(0).toUpperCase()}***`;
const anonymizePhone = (phone: string) => phone.replace(/\d{4}$/, '****');
const anonymizeAddress = (addr?: string) => addr ? 'Việt Nam' : 'Chưa cung cấp';
const calculateAge = (dob?: string) => {
  if (!dob) return 'Chưa cung cấp';
  const age = new Date().getFullYear() - new Date(dob).getFullYear();
  if (age <= 12) return 'Trẻ em';
  if (age <= 59) return 'Người lớn';
  return 'Người cao tuổi';
};

export default function AssistanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [assistance, setAssistance] = useState<AssistanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDonationForm, setShowDonationForm] = useState(false);

  const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

  // CHỈ ADMIN & CHARITY_ADMIN ĐƯỢC XEM CHI TIẾT
  useEffect(() => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      navigate('/login');
      return;
    }
    if (!['admin', 'charity_admin'].includes(user.role)) {
      toast.error('Bạn không có quyền truy cập');
      navigate('/assistance');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data } = await assistanceAPI.getById(id);
        setAssistance(data.data);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Không tải được chi tiết');
        navigate('/assistance');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  if (!user || !['admin', 'charity_admin'].includes(user.role)) return null;

  const handleApprove = async () => {
    if (!id) return;
    try {
      await assistanceAPI.updateStatus(id, { status: 'approved' });
      toast.success('Đã duyệt thành công!');
      const { data } = await assistanceAPI.getById(id);
      setAssistance(data.data);
    } catch { toast.error('Lỗi duyệt'); }
  };

  const handleReject = async () => {
    if (!id) return;
    try {
      await assistanceAPI.updateStatus(id, { status: 'rejected' });
      toast.success('Đã từ chối');
      const { data } = await assistanceAPI.getById(id);
      setAssistance(data.data);
    } catch { toast.error('Lỗi từ chối'); }
  };

  if (loading) return <div className="flex justify-center py-32"><div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  if (!assistance) return <div className="text-center py-32 text-red-600"><AlertCircle className="h-16 w-16 mx-auto mb-4" /><p className="text-xl">Không tìm thấy yêu cầu</p></div>;

  const progress = assistance.requestedAmount > 0 ? (assistance.raisedAmount / assistance.requestedAmount) * 100 : 0;
  const canDonate = assistance.status === 'approved';
  const canViewFull = true; // admin/charity_admin xem hết

  const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' VNĐ';

  const statusMap = {
    pending: { label: 'Chờ duyệt', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: <AlertCircle className="h-4 w-4" /> },
    approved: { label: 'Đã duyệt', color: 'text-green-600', bg: 'bg-green-50', icon: <CheckCircle2 className="h-4 w-4" /> },
    rejected: { label: 'Từ chối', color: 'text-red-600', bg: 'bg-red-50', icon: <XCircle className="h-4 w-4" /> },
    in_progress: { label: 'Đang thực hiện', color: 'text-blue-600', bg: 'bg-blue-50', icon: <Stethoscope className="h-4 w-4" /> },
    completed: { label: 'Hoàn thành', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 className="h-4 w-4" /> },
  };
  const statusConfig = statusMap[assistance.status] || statusMap.pending;

  const urgencyConfig = {
    low: { label: 'Bình thường', bg: 'bg-gray-100', text: 'text-gray-700' },
    medium: { label: 'Trung bình', bg: 'bg-yellow-100', text: 'text-yellow-700' },
    high: { label: 'Khẩn cấp', bg: 'bg-orange-100', text: 'text-orange-700' },
    critical: { label: 'Rất khẩn cấp', bg: 'bg-red-100', text: 'text-red-700' },
  }[assistance.urgency];

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          <Button variant="ghost" onClick={() => navigate('/assistance')} className="mb-6">
            <ArrowLeft className="mr-2 h-5 w-5" /> Quay lại danh sách
          </Button>

          <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{assistance.title}</h1>
            <div className="flex justify-center gap-4 flex-wrap">
              <Badge className={`${statusConfig.bg} ${statusConfig.color} px-4 py-2`}>
                {statusConfig.icon} <span className="ml-1 font-medium">{statusConfig.label}</span>
              </Badge>
              <Badge className={`${urgencyConfig.bg} ${urgencyConfig.text} px-4 py-2`}>
                <AlertCircle className="h-4 w-4 mr-1" /> {urgencyConfig.label}
              </Badge>
            </div>
          </motion.div>

          <Separator className="mb-10" />

          <div className="grid lg:grid-cols-3 gap-8">
            {/* CỘT TRÁI */}
            <div className="lg:col-span-2 space-y-8">
              {/* Thông tin bệnh nhân */}
              <Card className="border-2 shadow-xl">
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><User className="h-6 w-6" /> Thông tin bệnh nhân</h2>
                </div>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-2xl font-bold bg-primary/10">
                        {assistance.patientId.userId.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-2xl font-bold">{canViewFull ? assistance.patientId.userId.fullName : anonymizeName(assistance.patientId.userId.fullName)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 text-lg">
                    <div><span className="text-muted-foreground">Tuổi:</span> <strong>{calculateAge(assistance.patientId.userId.profile?.dateOfBirth)}</strong></div>
                    <div><span className="text-muted-foreground">Khu vực:</span> <strong>{anonymizeAddress(assistance.patientId.userId.profile?.address)}</strong></div>
                    <div><span className="text-muted-foreground">Liên hệ:</span> <strong>{canViewFull ? assistance.contactPhone : anonymizePhone(assistance.contactPhone)}</strong></div>
                  </div>
                </CardContent>
              </Card>

              {/* Tình hình tài chính */}
              <Card className="border-2 shadow-xl">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-6 w-6" /> Tình hình quyên góp</h2>
                </div>
                <CardContent className="p-8 space-y-6">
                  <div className="text-2xl space-y-3">
                    <div className="flex justify-between"><span>Cần hỗ trợ</span> <strong>{formatVND(assistance.requestedAmount)}</strong></div>
                    <div className="flex justify-between"><span>Đã nhận</span> <strong className="text-green-600">{formatVND(assistance.raisedAmount)}</strong></div>
                    <div className="flex justify-between"><span>Còn thiếu</span> <strong className="text-red-600">{formatVND(assistance.requestedAmount - assistance.raisedAmount)}</strong></div>
                  </div>
                  <div>
                    <Progress value={progress} className="h-5" />
                    <p className="text-center mt-2 text-xl font-bold">{progress.toFixed(1)}% hoàn thành</p>
                  </div>
                </CardContent>
              </Card>

              {/* Mô tả */}
              <Card className="border-2 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><Stethoscope className="h-6 w-6 text-primary" /> Tình trạng bệnh</h3>
                  <p className="text-lg font-medium mb-6 bg-muted/50 p-4 rounded-lg">{assistance.medicalCondition}</p>
                  <Separator className="my-6" />
                  <h3 className="text-2xl font-bold mb-4">Chi tiết câu chuyện</h3>
                  <ScrollArea className="h-48 border rounded-lg p-4 bg-muted/30">
                    <p className="whitespace-pre-wrap leading-relaxed">{assistance.description}</p>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* CỘT PHẢI */}
            <div className="space-y-8">
              {/* Ảnh minh chứng */}
              <Card className="border-2 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <ImageIcon className="h-6 w-6" /> Ảnh minh chứng
                  </h3>
                </div>
                <CardContent className="p-6">
                  <ScrollArea className="h-96">
                    {assistance.attachments && assistance.attachments.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {assistance.attachments.map((file, i) => {
                          // Đường dẫn ảnh – ĐẢM BẢO đúng format
                          const imageUrl = `${API_SERVER}${file.path.startsWith('/') ? '' : '/'}${file.path}`;

                          return (
                            <a
                              key={i}
                              href={imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 hover:border-primary transition-all duration-300 shadow-md hover:shadow-xl"
                            >
                              <img
                                src={imageUrl}
                                alt={file.filename}
                                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                                // FIX: Placeholder đơn giản, không lỗi domain
                                onError={(e) => {
                                  e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn5mDIEjhu5MgTOG7jWMgTOG6pXQLPC90ZXh0Pjwvc3ZnPg==";
                                  e.currentTarget.onerror = null;
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <p className="text-xs font-medium truncate">{file.filename}</p>
                                <p className="text-xs opacity-80">Click để xem ảnh lớn</p>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
                        <p className="text-lg">Chưa có ảnh minh chứng</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Hành động */}
              <Card className="border-2 shadow-xl">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-2xl font-bold mb-4">Hành động</h3>
                  {assistance.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-4">
                      <Button onClick={handleApprove} size="lg" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="mr-2" /> Duyệt
                      </Button>
                      <Button onClick={handleReject} size="lg" variant="destructive">
                        <XCircle className="mr-2" /> Từ chối
                      </Button>
                    </div>
                  )}
                  {canDonate && (
                    <Button onClick={() => setShowDonationForm(true)} size="lg" className="w-full bg-red-600 hover:bg-red-700">
                      <Heart className="mr-2" /> Ủng hộ ngay
                    </Button>
                  )}
                  {assistance.status === 'completed' && (
                    <div className="text-center py-8 bg-emerald-50 rounded-xl">
                      <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
                      <p className="text-emerald-700 font-bold text-xl">ĐÃ HOÀN THÀNH!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lịch sử */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Calendar className="h-5 w-5" /> Lịch sử</h3>
                  <div className="space-y-3 text-sm">
                    <p><span className="text-muted-foreground">Tạo lúc:</span> {new Date(assistance.createdAt).toLocaleString('vi-VN')}</p>
                    {assistance.approvedBy && <p><span className="text-muted-foreground">Duyệt bởi:</span> {assistance.approvedBy.fullName}</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>

      {canDonate && <DonationForm open={showDonationForm} onOpenChange={setShowDonationForm} assistanceId={assistance._id} />}
      <ScrollToTop />
      <ChatBubble />
    </>
  );
}