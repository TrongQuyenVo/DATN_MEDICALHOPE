import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Stethoscope, DollarSign, FileText,
  Calendar, CheckCircle, XCircle, Heart, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from 'recharts';

interface AssistanceRequest {
  _id: string;
  patientId: {
    userId: {
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

// Tính tuổi an toàn
const calculateAge = (dateOfBirth?: string): string => {
  if (!dateOfBirth) return 'Không có thông tin';
  const birth = new Date(dateOfBirth);
  if (isNaN(birth.getTime())) return 'Không hợp lệ';

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age.toString();
};

export default function AssistanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [assistance, setAssistance] = useState<AssistanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const API_SERVER = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data } = await assistanceAPI.getById(id);
        console.log('API Response:', data); // DEBUG: Kiểm tra cấu trúc
        setAssistance(data.data);
      } catch (error) {
        toast.error('Không tải được chi tiết yêu cầu');
        console.error(error);
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
    return <div className="text-center py-12">Đang tải chi tiết...</div>;
  }

  if (!assistance) {
    return <div className="text-center py-12 text-red-600">Không tìm thấy yêu cầu</div>;
  }

  const isAdmin = ['admin', 'charity_admin'].includes(user?.role || '');
  const progress = (assistance.raisedAmount / assistance.requestedAmount) * 100;
  const remaining = assistance.requestedAmount - assistance.raisedAmount;

  const getStatusBadge = () => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'Chờ duyệt' },
      approved: { variant: 'default', label: 'Đã duyệt' },
      in_progress: { variant: 'outline', label: 'Đang thực hiện' },
      completed: { variant: 'default', label: 'Hoàn thành' },
      rejected: { variant: 'destructive', label: 'Từ chối' },
    };
    return (
      <Badge variant={map[assistance.status]?.variant || 'secondary'}>
        {map[assistance.status]?.label || 'Không xác định'}
      </Badge>
    );
  };

  const getUrgencyBadge = () => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      low: { variant: 'secondary', label: 'Bình thường' },
      medium: { variant: 'default', label: 'Trung bình' },
      high: { variant: 'destructive', label: 'Khẩn cấp' },
      critical: { variant: 'destructive', label: 'Rất khẩn cấp' },
    };
    return (
      <Badge variant={map[assistance.urgency]?.variant || 'secondary'}>
        {map[assistance.urgency]?.label || 'Không xác định'}
      </Badge>
    );
  };

  const getRequestTypeLabel = () => {
    const map: Record<string, string> = {
      medical_treatment: 'Điều trị y tế',
      medication: 'Thuốc men',
      equipment: 'Thiết bị y tế',
      surgery: 'Phẫu thuật',
      emergency: 'Cấp cứu',
      rehabilitation: 'Phục hồi chức năng',
      other: 'Khác',
    };
    return map[assistance.requestType] || 'Không xác định';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-4xl mx-auto py-8"
    >
      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{assistance.title}</h1>
        <div className="flex justify-center items-center gap-4">
          {getStatusBadge()}
          {getUrgencyBadge()}
        </div>
      </div>
      <Separator />

      {/* PATIENT INFO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Thông tin bệnh nhân
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Họ tên</Label>
            <p className="font-medium">
              {assistance.patientId?.userId?.fullName || 'Không có thông tin'}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Tuổi</Label>
            <p className="font-medium">
              {calculateAge(assistance.patientId?.userId?.profile?.dateOfBirth)}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Địa chỉ</Label>
            <p className="font-medium">
              {assistance.patientId?.userId?.profile?.address || 'Không có thông tin'}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">SĐT liên hệ</Label>
            <p className="font-medium">{assistance.contactPhone}</p>
          </div>
        </CardContent>
      </Card>

      {/* REQUEST DETAIL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Chi tiết yêu cầu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Loại hỗ trợ</Label>
            <p className="font-medium">{getRequestTypeLabel()}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Tình trạng bệnh lý</Label>
            <p className="text-muted-foreground">{assistance.medicalCondition}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Mô tả chi tiết</Label>
            <ScrollArea className="h-32 border rounded p-2 bg-muted/50">
              <p className="text-muted-foreground">{assistance.description}</p>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* FINANCE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Thông tin tài chính
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>Cần hỗ trợ:</span>
            <span className="font-medium">
              {assistance.requestedAmount.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
          <div className="flex justify-between">
            <span>Đã quyên góp:</span>
            <span className="font-medium text-green-600">
              {assistance.raisedAmount.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
          <div className="flex justify-between">
            <span>Còn thiếu:</span>
            <span className="font-medium text-red-600">
              {remaining > 0 ? remaining.toLocaleString('vi-VN') : 0} VNĐ
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-center text-sm text-muted-foreground">
            {progress.toFixed(1)}% hoàn thành
          </p>
        </CardContent>
      </Card>

      {/* ATTACHMENTS - ĐẢM BẢO HIỆN */}
      {assistance.attachments && Array.isArray(assistance.attachments) && assistance.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Tài liệu đính kèm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {assistance.attachments.map((file, i) => (
                <li key={i} className="flex items-center justify-between bg-muted p-2 rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{file.filename}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <a
                    href={`${API_SERVER}${file.path}`}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" /> Tải về
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* HISTORY */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Lịch sử
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Ngày tạo:</span>
            <span>{new Date(assistance.createdAt).toLocaleString('vi-VN')}</span>
          </div>
          {assistance.approvedBy && (
            <div className="flex justify-between">
              <span>Duyệt bởi:</span>
              <span>{assistance.approvedBy.fullName}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ACTIONS */}
      <div className="flex justify-end gap-4">
        {/* Admin: Duyệt / Từ chối */}
        {isAdmin && assistance.status === 'pending' && (
          <>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" /> Duyệt
            </Button>
            <Button onClick={handleReject} variant="destructive">
              <XCircle className="mr-2 h-4 w-4" /> Từ chối
            </Button>
          </>
        )}

        {/* Người dùng: Ủng hộ (chỉ khi đã duyệt và KHÔNG phải admin) */}
        {!isAdmin && assistance.status === 'approved' && (
          <Button
            onClick={() => setShowDonationForm(true)}
            className="bg-red-500 hover:bg-red-600"
          >
            <Heart className="mr-2 h-4 w-4" /> Ủng hộ ngay
          </Button>
        )}
      </div>

      {/* Donation Form */}
      {assistance && (
        <DonationForm
          open={showDonationForm}
          onOpenChange={setShowDonationForm}
          assistance={assistance}
        />
      )}

      <ScrollToTop />
      <ChatBubble />
    </motion.div>
  );
}