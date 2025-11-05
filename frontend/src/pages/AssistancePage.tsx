/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HandHeart, AlertCircle, CheckCircle, Clock, XCircle,
  DollarSign, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/authStore';
import { assistanceAPI } from '@/lib/api';
import AssistanceRequestForm from '@/components/form/AssistanceRequestForm';
import toast from 'react-hot-toast';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';
import { useNavigate } from 'react-router-dom';

interface AssistanceRequest {
  _id: string;
  patientId: {
    _id: string;
    userId?: { fullName?: string; phone?: string; _id?: string } | string;
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
  approvedBy?: { fullName?: string };
}

export default function AssistancePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await assistanceAPI.getAll({ limit: 50 });
      setAssistanceRequests(data.data || []);
    } catch (error) {
      console.error('Fetch requests error:', error);
      toast.error('Không tải được danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleApproveRequest = async (id: string) => {
    try {
      await assistanceAPI.updateStatus(id, { status: 'approved' });
      toast.success('Đã duyệt yêu cầu!');
      await fetchRequests();
    } catch (error) {
      toast.error('Lỗi khi duyệt yêu cầu');
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await assistanceAPI.updateStatus(id, { status: 'rejected' });
      toast.success('Đã từ chối yêu cầu!');
      await fetchRequests();
    } catch (error) {
      toast.error('Lỗi khi từ chối yêu cầu');
    }
  };

  if (!user) return null;

  const isPatient = user.role === 'patient';
  const isAdmin = ['admin', 'charity_admin'].includes(user.role);

  const visibleRequests = isAdmin
    ? assistanceRequests
    : assistanceRequests.filter((req) => {
      const myPatientId = (user as any).patientId?._id || user.id;
      const isOwner = String(req.patientId._id) === String(myPatientId);
      return isOwner || req.status === 'approved';
    });

  const getStatusConfig = (status: string) => {
    const map = {
      approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Đã duyệt' },
      in_progress: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Đang thực hiện' },
      pending: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Chờ duyệt' },
      rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Từ chối' },
      completed: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Hoàn thành' },
    };
    return map[status as keyof typeof map] || map.pending;
  };

  const getUrgencyBadge = (urgency: string) => {
    const map = {
      critical: { label: 'RẤT KHẨN', class: 'bg-red-600 text-white' },
      high: { label: 'KHẨN CẤP', class: 'bg-orange-600 text-white' },
      medium: { label: 'TRUNG BÌNH', class: 'bg-yellow-600 text-white' },
      low: { label: 'BÌNH THƯỜNG', class: 'bg-green-600 text-white' },
    };
    const config = map[urgency as keyof typeof map] || map.low;
    return <Badge className={config.class}>{config.label}</Badge>;
  };

  const getRequestTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      medical_treatment: 'Điều trị y tế',
      medication: 'Thuốc men',
      equipment: 'Thiết bị y tế',
      surgery: 'Phẫu thuật',
      emergency: 'Cấp cứu',
      rehabilitation: 'Phục hồi chức năng',
      other: 'Khác',
    };
    return map[type] || 'Khác';
  };

  const stats = {
    total: assistanceRequests.length,
    pending: assistanceRequests.filter(r => r.status === 'pending').length,
    approved: assistanceRequests.filter(r => r.status === 'approved').length,
    totalRaised: assistanceRequests.reduce((sum, r) => sum + (r.raisedAmount || 0), 0),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-10"
    >
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="healthcare-heading text-3xl font-bold">
            {isPatient ? 'Yêu cầu hỗ trợ của tôi' : 'Quản lý yêu cầu hỗ trợ'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isPatient
              ? 'Gửi yêu cầu hỗ trợ chi phí y tế và theo dõi tiến độ'
              : 'Duyệt, quản lý và hỗ trợ các trường hợp cần giúp đỡ'}
          </p>
        </div>
        {isPatient && (
          <Button onClick={() => setShowRequestForm(true)} className="bg-primary hover:bg-primary/90">
            <HandHeart className="mr-2 h-4 w-4" />
            Gửi yêu cầu mới
          </Button>
        )}
      </div>

      {/* ADMIN STATS */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Tổng yêu cầu', icon: HandHeart, value: stats.total, color: 'text-primary' },
            { title: 'Chờ duyệt', icon: Clock, value: stats.pending, color: 'text-yellow-600' },
            { title: 'Đã duyệt', icon: CheckCircle, value: stats.approved, color: 'text-green-600' },
            { title: 'Tổng hỗ trợ', icon: DollarSign, value: `${stats.totalRaised.toLocaleString('vi-VN')} VNĐ`, color: 'text-emerald-600' },
          ].map((stat, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* LIST */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">Danh sách yêu cầu</h2>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải dữ liệu...</div>
        ) : visibleRequests.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <HandHeart className="h-12 w-12 mx-auto mb-4 text-muted" />
            <p>Chưa có yêu cầu hỗ trợ nào.</p>
            {isPatient && <p className="mt-2">Hãy gửi yêu cầu đầu tiên!</p>}
          </Card>
        ) : (
          <div className="space-y-4">
            {visibleRequests.map((req, i) => {
              const progress = (req.raisedAmount / req.requestedAmount) * 100 || 0;
              const status = getStatusConfig(req.status);
              const StatusIcon = status.icon;
              const myPatientId = (user as any).patientId?._id || user.id;
              const isOwner = String(req.patientId._id) === String(myPatientId);
              const patientName =
                typeof req.patientId.userId === 'object'
                  ? req.patientId.userId?.fullName
                  : req.patientId.fullName || 'Ẩn danh';

              return (
                <motion.div
                  key={req._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/assistance/${req._id}`)}
                  className="cursor-pointer"
                >
                  <Card className="hover:shadow-lg transition-all hover:scale-[1.01] border-2 hover:border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        {/* LEFT: INFO */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-primary">{patientName}</h3>
                            {getUrgencyBadge(req.urgency)}
                            <Badge className={`${status.bg} ${status.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground">
                            <strong>Tiêu đề:</strong> {req.title}
                          </p>

                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {req.description}
                          </p>

                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>Ngày gửi: {new Date(req.createdAt).toLocaleDateString('vi-VN')}</span>
                            <span>{getRequestTypeLabel(req.requestType)}</span>
                            {req.approvedBy?.fullName && <span>Duyệt bởi: {req.approvedBy.fullName}</span>}
                          </div>
                        </div>

                        {/* RIGHT: PROGRESS + ACTION */}
                        <div className="flex flex-col items-end gap-3 w-full lg:w-64">
                          {req.status !== 'pending' && (
                            <div className="w-full space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">
                                  {req.raisedAmount.toLocaleString()} VNĐ
                                </span>
                                <span className="text-muted-foreground">
                                  / {req.requestedAmount.toLocaleString()} VNĐ
                                </span>
                              </div>
                              <Progress value={progress} className="h-2" />
                              <p className="text-xs text-right text-muted-foreground">
                                {progress.toFixed(0)}% hoàn thành
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2 w-full">
                            {isAdmin && req.status === 'pending' ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); handleApproveRequest(req._id); }}
                                  className="flex-1"
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" /> Duyệt
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => { e.stopPropagation(); handleRejectRequest(req._id); }}
                                  className="flex-1 text-red-600 border-red-600"
                                >
                                  <XCircle className="mr-1 h-3 w-3" /> Từ chối
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); navigate(`/assistance/${req._id}`); }}
                                className="flex-1"
                              >
                                <Eye className="mr-1 h-3 w-3" /> Xem
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* FORMS */}
      <AssistanceRequestForm open={showRequestForm} onOpenChange={setShowRequestForm} />
      <ScrollToTop />
      <ChatBubble />
    </motion.div>
  );
}
