/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HandHeart, AlertCircle, CheckCircle, Clock, XCircle,
  DollarSign, Eye, Trash2
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

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa yêu cầu này? Hành động này không thể hoàn tác.')) {
      return;
    }
    try {
      await assistanceAPI.delete(id);
      toast.success('Đã xóa yêu cầu thành công!');
      await fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa yêu cầu');
    }
  };

  if (!user) return null;

  const isPatient = user.role === 'patient';
  const isAdmin = ['admin'].includes(user.role);

  const myPatientId = (user as any).patientId?._id || user.id;

  const visibleRequests = isAdmin
    ? assistanceRequests
    : assistanceRequests.filter((req) => {
      const isOwner = String(req.patientId._id) === String(myPatientId);
      return isOwner || req.status === 'approved' || req.status === 'pending';
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
    return <Badge className={`font-medium ${config.class}`}>{config.label}</Badge>;
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

  const formatVND = (amount: number) => {
    if (amount == null || isNaN(amount)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  };

  const getPatientName = (patient: AssistanceRequest['patientId']) => {
    if (typeof patient.userId === 'object' && patient.userId?.fullName) {
      return patient.userId.fullName;
    }
    if (patient.fullName) return patient.fullName;
    return 'Ẩn danh';
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
            { title: 'Tổng hỗ trợ', icon: DollarSign, value: `${stats.totalRaised.toLocaleString('vi-VN')} ₫`, color: 'text-emerald-600' },
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
        <h2 className="text-2xl font-bold">Danh sách yêu cầu hỗ trợ</h2>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Đang tải dữ liệu...</div>
        ) : visibleRequests.length === 0 ? (
          <Card className="text-center py-16">
            <HandHeart className="h-16 w-16 mx-auto mb-4 text-muted" />
            <p className="text-lg text-muted-foreground">Chưa có yêu cầu hỗ trợ nào</p>
            {isPatient && <p className="text-sm mt-2">Hãy nhấn "Gửi yêu cầu mới" để bắt đầu</p>}
          </Card>
        ) : (
          <div className="grid gap-6">
            {visibleRequests.map((req) => {
              const progress = req.requestedAmount > 0 ? (req.raisedAmount / req.requestedAmount) * 100 : 0;
              const status = getStatusConfig(req.status);
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={req._id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="cursor-pointer"
                  onClick={() => navigate(`/assistance/${req._id}`)}
                >
                  <Card className="hover:shadow-xl transition-all hover:border-primary border-2">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row justify-between gap-6">
                        {/* Thông tin chính */}
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between flex-wrap gap-3">
                            <h3 className="text-2xl font-bold text-primary">
                              {getPatientName(req.patientId)}
                            </h3>
                            <div className="flex gap-2">
                              {getUrgencyBadge(req.urgency)}
                              <Badge className={`${status.bg} ${status.color} font-medium`}>
                                <StatusIcon className="h-3 w-3 mr-1" /> {status.label}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-lg font-semibold">{req.title}</p>
                          <p className="text-muted-foreground line-clamp-2">{req.description}</p>

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</span>
                            <span>{getRequestTypeLabel(req.requestType)}</span>
                            {req.approvedBy?.fullName && (
                              <span className="text-green-700 font-medium">
                                Duyệt bởi: {req.approvedBy.fullName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Thanh tiến độ + Nút hành động */}
                        <div className="flex flex-col items-end gap-5 w-full lg:w-80">
                          {/* Progress chỉ hiện khi đã duyệt */}
                          {req.status === 'approved' && (
                            <div className="w-full space-y-2 text-right">
                              <div className="flex justify-between text-lg font-bold">
                                <span className="text-primary">{formatVND(req.raisedAmount)}</span>
                                <span className="text-muted-foreground">/ {formatVND(req.requestedAmount)}</span>
                              </div>
                              <Progress value={progress} className="h-3" />
                              <p className="text-sm text-muted-foreground">{progress.toFixed(1)}% đã quyên góp</p>
                            </div>
                          )}

                          {/* Nút hành động */}
                          <div className="flex gap-3 w-full flex-wrap">
                            {/* Admin: Duyệt / Từ chối (chỉ khi pending) */}
                            {isAdmin && req.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveRequest(req._id);
                                  }}
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" /> Duyệt
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectRequest(req._id);
                                  }}
                                >
                                  <XCircle className="mr-1 h-4 w-4" /> Từ chối
                                </Button>
                              </>
                            )}

                            {/* Luôn có nút Xem chi tiết */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/assistance/${req._id}`);
                              }}
                            >
                              <Eye className="mr-1 h-4 w-4" /> Xem chi tiết
                            </Button>

                            {/* Admin: Xóa yêu cầu */}
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRequest(req._id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
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

      {/* Form gửi yêu cầu */}
      <AssistanceRequestForm
        open={showRequestForm}
        onOpenChange={(open) => {
          setShowRequestForm(open);
          if (!open) {
            fetchRequests();
          }
        }}
      />

      <ScrollToTop />
    </motion.div>
  );
}