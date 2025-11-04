import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HandHeart, AlertCircle, CheckCircle, Clock, XCircle, Heart, DollarSign, FileText, Zap, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/authStore';
import { assistanceAPI } from '@/lib/api';
import AssistanceRequestForm from '@/components/form/AssistanceRequestForm';
import toast from 'react-hot-toast';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';

interface AssistanceRequest {
  _id: string;
  patientId: {
    _id: string;
    userId: { fullName: string; phone: string; _id: string } | string;
    fullName?: string;
  };
  requestType: string;
  title: string;
  description: string;
  requestedAmount: number;
  raisedAmount: number;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  urgency: string;
  contactPhone: string;
  medicalCondition: string;
  createdAt: string;
  approvedBy?: { fullName: string };
}

export default function AssistancePage() {
  const { user } = useAuthStore();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Server will automatically scope to the patient when role === 'patient'
        const { data } = await assistanceAPI.getAll({ limit: 50 });
        setAssistanceRequests(data.data || []);
      } catch (error) {
        console.error('Fetch requests error:', error);
        toast.error('Không tải được danh sách yêu cầu');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]);

  const handleApproveRequest = async (id: string) => {
    try {
      await assistanceAPI.updateStatus(id, { status: 'approved' });
      toast.success('Đã duyệt yêu cầu!');
      const { data } = await assistanceAPI.getAll({ limit: 50 });
      setAssistanceRequests(data.data || []);
    } catch (error) {
      toast.error('Lỗi khi duyệt yêu cầu');
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await assistanceAPI.updateStatus(id, { status: 'rejected' });
      toast.success('Đã từ chối yêu cầu!');
      const { data } = await assistanceAPI.getAll({ limit: 50 });
      setAssistanceRequests(data.data || []);
    } catch (error) {
      toast.error('Lỗi khi từ chối yêu cầu');
    }
  };

  if (!user) return null;

  const getPageTitle = () => {
    switch (user.role) {
      case 'patient': return 'Yêu cầu hỗ trợ y tế';
      case 'admin': case 'charity_admin': return 'Quản lý yêu cầu hỗ trợ';
      default: return 'Hỗ trợ y tế từ thiện';
    }
  };

  const getPageSubtitle = () => {
    switch (user.role) {
      case 'patient': return 'Gửi yêu cầu hỗ trợ chi phí y tế và xem các trường hợp khác';
      case 'admin': case 'charity_admin': return 'Duyệt và quản lý các yêu cầu hỗ trợ y tế';
      default: return 'Xem và ủng hộ các trường hợp cần hỗ trợ y tế';
    }
  };

  const getVisibleRequests = () => {
    switch (user.role) {
      case 'patient':
        return assistanceRequests.filter(req => {
          const ownerUserId =
            typeof req.patientId?.userId === 'string'
              ? req.patientId.userId
              : req.patientId?.userId?._id;
          const isOwner =
            String(req.patientId?._id) === String(user.id) ||
            String(ownerUserId) === String(user.id);
          // owner sees all their requests (pending, rejected, approved, ...)
          // others see only approved
          return isOwner || req.status === 'approved';
        });
      case 'admin': case 'charity_admin':
        return assistanceRequests;
      default:
        return assistanceRequests.filter(req => req.status === 'approved');
    }
  };

  const visibleRequests = getVisibleRequests();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'in_progress': return Clock;
      case 'pending': return AlertCircle;
      case 'rejected': return XCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'status-completed';
      case 'in_progress': return 'status-confirmed';
      case 'pending': return 'status-scheduled';
      case 'rejected': return 'status-cancelled';
      default: return 'status-scheduled';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Đã duyệt';
      case 'in_progress': return 'Đang thực hiện';
      case 'pending': return 'Chờ duyệt';
      case 'rejected': return 'Từ chối';
      default: return 'Không xác định';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-success text-success-foreground';
      case 'critical': return 'bg-red-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'Khẩn cấp';
      case 'medium': return 'Trung bình';
      case 'low': return 'Bình thường';
      case 'critical': return 'Rất khẩn cấp';
      default: return 'Không xác định';
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'medical_treatment': return 'Chi phí điều trị y tế';
      case 'medication': return 'Chi phí thuốc men';
      case 'equipment': return 'Chi phí thiết bị y tế';
      case 'surgery': return 'Chi phí phẫu thuật';
      case 'emergency': return 'Chi phí cấp cứu';
      case 'rehabilitation': return 'Chi phí phục hồi';
      default: return 'Khác';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* HEADER & STATS & LIST - GIỮ NGUYÊN NHƯ CODE TRÊN */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="healthcare-heading text-3xl font-bold">{getPageTitle()}</h1>
          <p className="healthcare-subtitle">{getPageSubtitle()}</p>
        </div>
        {user.role === 'patient' && (
          <Button className="btn-assistance" onClick={() => setShowRequestForm(true)}>
            <HandHeart className="mr-2 h-4 w-4" />
            Gửi yêu cầu hỗ trợ
          </Button>
        )}
      </div>

      {(user.role === 'admin' || user.role === 'charity_admin') && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="healthcare-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng yêu cầu</CardTitle>
              <HandHeart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{assistanceRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                +{assistanceRequests.filter(r => new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} yêu cầu mới
              </p>
            </CardContent>
          </Card>
          <Card className="healthcare-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{assistanceRequests.filter(r => r.status === 'pending').length}</div>
              <p className="text-xs text-muted-foreground">Cần xem xét</p>
            </CardContent>
          </Card>
          <Card className="healthcare-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{assistanceRequests.filter(r => r.status === 'approved').length}</div>
              <p className="text-xs text-muted-foreground">
                Tỷ lệ {((assistanceRequests.filter(r => r.status === 'approved').length / assistanceRequests.length * 100) || 0).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card className="healthcare-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng hỗ trợ</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {assistanceRequests.reduce((sum, r) => sum + r.raisedAmount, 0).toLocaleString()} VNĐ
              </div>
              <p className="text-xs text-muted-foreground">Tổng quyên góp</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-6">
        <h2 className="healthcare-heading text-2xl font-bold">
          {(user.role === 'admin' || user.role === 'charity_admin') ? 'Tất cả yêu cầu hỗ trợ' : 'Danh sách yêu cầu hỗ trợ'}
        </h2>
        {loading ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : visibleRequests.length > 0 ? (
          visibleRequests.map((request, index) => {
            const progress = (request.raisedAmount / request.requestedAmount) * 100;
            const patientName = request.patientId.fullName || (typeof request.patientId.userId === 'string' ? '' : request.patientId.userId.fullName);
            const StatusIcon = getStatusIcon(request.status);

            const ownerUserId =
              typeof request.patientId?.userId === 'string'
                ? request.patientId.userId
                : request.patientId?.userId?._id;
            const isOwner =
              String(request.patientId?._id) === String(user.id) ||
              String(ownerUserId) === String(user.id);

            return (
              <motion.div key={request._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                <Card className="healthcare-card">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold healthcare-heading">{patientName}</h3>
                          <Badge className={getStatusColor(request.status)}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {getStatusLabel(request.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                          <span>Loại: {getRequestTypeLabel(request.requestType)}</span>
                          <span>Ngày gửi: {new Date(request.createdAt).toLocaleDateString('vi-VN')}</span>
                          {request.approvedBy && <span>Duyệt bởi: {request.approvedBy.fullName}</span>}
                        </div>
                        <p className="text-muted-foreground mb-4">{request.title}</p>
                      </div>
                    </div>

                    {request.status !== 'pending' && <Progress value={progress} className="mb-4" />}

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Badge className={getUrgencyColor(request.urgency)}>{getUrgencyLabel(request.urgency)}</Badge>
                        <Badge variant="outline">{getRequestTypeLabel(request.requestType)}</Badge>
                      </div>

                      <div className="flex space-x-2">
                        {(user.role === 'admin' || user.role === 'charity_admin') && request.status === 'pending' ? (
                          <>
                            <Button size="sm" onClick={() => handleApproveRequest(request._id)} className="btn-healthcare">
                              <CheckCircle className="mr-1 h-4 w-4" /> Duyệt
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRejectRequest(request._id)} className="text-red-600 border-red-600 hover:bg-red-50">
                              <XCircle className="mr-1 h-4 w-4" /> Từ chối
                            </Button>
                          </>
                        ) : (user.role === 'admin' || user.role === 'charity_admin') ? (
                          <Button size="sm" variant="outline">
                            <Eye className="mr-1 h-4 w-4" /> Chi tiết
                          </Button>
                        ) : (request.status === 'approved' && !isOwner) ? (
                          <Button size="sm" className="btn-charity">
                            <Heart className="mr-1 h-4 w-4" /> Ủng hộ
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {user.role === 'patient' ? 'Chưa có yêu cầu hỗ trợ nào' : 'Không có yêu cầu hỗ trợ nào'}
          </div>
        )}
      </div>

      {user.role === 'patient' && (
        <AssistanceRequestForm open={showRequestForm} onOpenChange={setShowRequestForm} />
      )}
      <ScrollToTop />
      <ChatBubble />
    </motion.div>
  );
}