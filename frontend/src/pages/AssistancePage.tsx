/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HandHeart, AlertCircle, CheckCircle, Clock, XCircle, Eye, Trash2, Gift, Download, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/authStore';
import { assistanceAPI, donationsAPI } from '@/lib/api';
import AssistanceRequestForm from '@/components/form/AssistanceRequestForm';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ChatBubble from './ChatbotPage';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

interface Donation {
  _id: string;
  userId: { fullName: string; email?: string };
  amount: number;
  campaignId?: { title: string };
  assistanceId?: { title: string };
  isAnonymous: boolean;
  status: string;
  createdAt: string;
  note?: string;
}

export default function AssistancePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(true);

  const isAdmin = user?.role === 'admin';
  const isPatient = user?.role === 'patient';

  const fetchAssistance = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await assistanceAPI.getAll({ limit: 100 });
      setAssistanceRequests(data.data || []);
    } catch (error) {
      toast.error('Không tải được danh sách yêu cầu hỗ trợ');
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = async () => {
    if (!user) return;
    try {
      setLoadingDonations(true);
      const res = await donationsAPI.getAll({
        limit: '',
        sort: '-createdAt',
      });
      setDonations(res.data.data || []);
    } catch (error) {
      toast.error('Không tải được danh sách quyên góp');
    } finally {
      setLoadingDonations(false);
    }
  };

  useEffect(() => {
    fetchAssistance();
    fetchDonations();
  }, [user]);

  const handleApproveRequest = async (id: string) => {
    try {
      await assistanceAPI.updateStatus(id, { status: 'approved' });
      toast.success('Đã duyệt yêu cầu!');
      fetchAssistance();
    } catch {
      toast.error('Lỗi khi duyệt');
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await assistanceAPI.updateStatus(id, { status: 'rejected' });
      toast.success('Đã từ chối yêu cầu!');
      fetchAssistance();
    } catch {
      toast.error('Lỗi khi từ chối');
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Xóa yêu cầu này? Không thể hoàn tác.')) return;
    try {
      await assistanceAPI.delete(id);
      toast.success('Đã xóa!');
      fetchAssistance();
    } catch {
      toast.error('Lỗi khi xóa');
    }
  };

  // === Xuất Excel Quyên góp ===
  const exportDonationsToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Quyên góp');

    worksheet.columns = [
      { header: 'STT', key: 'index', width: 8 },
      { header: 'Người quyên góp', key: 'donor', width: 22 },
      { header: 'Chương trình', key: 'target', width: 35 },
      { header: 'Số tiền', key: 'amount', width: 18 },
      { header: 'Ghi chú', key: 'note', width: 30 },
      { header: 'Thời gian', key: 'time', width: 20 },
      { header: 'Ẩn danh', key: 'anonymous', width: 10 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A73E8' } };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    donations.forEach((d, i) => {
      const donor = d.isAnonymous ? 'Ẩn danh' : d.userId?.fullName || 'Người dùng';
      const target = d.assistanceId?.title || d.campaignId?.title || 'Quyên góp chung';

      worksheet.addRow({
        index: i + 1,
        donor,
        target,
        amount: d.amount,
        note: d.note || '',
        time: new Date(d.createdAt).toLocaleString('vi-VN'),
        anonymous: d.isAnonymous ? 'Có' : 'Không',
      });
    });

    worksheet.getColumn('amount').numFmt = '#,##0';
    worksheet.getColumn('amount').alignment = { horizontal: 'right' };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(blob, `Quyen_gop_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Xuất Excel thành công!');
  };

  if (!user) return null;

  const myPatientId = (user as any).patientId?._id || user.id;
  const visibleRequests = isAdmin
    ? assistanceRequests
    : assistanceRequests.filter(r => {
      const isOwner = String(r.patientId._id) === String(myPatientId);
      return isOwner || ['approved', 'in_progress', 'completed'].includes(r.status);
    });

  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

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
    const map: Record<string, { label: string; class: string }> = {
      critical: { label: 'RẤT KHẨN', class: 'bg-red-600 text-white' },
      high: { label: 'KHẨN CẤP', class: 'bg-orange-600 text-white' },
      medium: { label: 'TRUNG BÌNH', class: 'bg-yellow-600 text-white' },
      low: { label: 'BÌNH THƯỜNG', class: 'bg-green-600 text-white' },
    };
    const config = map[urgency] || map.low;
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
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getPatientName = (patient: any) => {
    if (typeof patient.userId === 'object' && patient.userId?.fullName) return patient.userId.fullName;
    if (patient.fullName) return patient.fullName;
    return 'Ẩn danh';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="healthcare-heading text-3xl font-bold">
            Hỗ trợ y tế & Quyên góp từ thiện
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý yêu cầu hỗ trợ và theo dõi các khoản quyên góp từ cộng đồng
          </p>
        </div>
        {isPatient && (
          <Button onClick={() => setShowRequestForm(true)} className="bg-primary hover:bg-primary/90">
            <HandHeart className="mr-2 h-4 w-4" />
            Gửi yêu cầu hỗ trợ
          </Button>
        )}
      </div>

      {/* === PHẦN 1: YÊU CẦU HỖ TRỢ === */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <HandHeart className="h-7 w-7 text-primary" />
          Yêu cầu hỗ trợ y tế
        </h2>

        {loading ? (
          <div className="text-center py-12">Đang tải yêu cầu hỗ trợ...</div>
        ) : visibleRequests.length === 0 ? (
          <Card className="text-center py-16">
            <HandHeart className="h-16 w-16 mx-auto mb-4 text-muted" />
            <p className="text-lg">Chưa có yêu cầu hỗ trợ nào</p>
          </Card>
        ) : (
          <div className="grid gap-5">
            {visibleRequests.map((req) => {
              const progress = req.requestedAmount > 0 ? (req.raisedAmount / req.requestedAmount) * 100 : 0;
              const status = getStatusConfig(req.status);
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={req._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="cursor-pointer"
                  onClick={() => navigate(`/assistance/${req._id}`)}
                >
                  <Card className="hover:shadow-lg transition-all border-2 hover:border-primary">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-start justify-between flex-wrap gap-3">
                            <h3 className="text-xl font-bold text-primary">{getPatientName(req.patientId)}</h3>
                            <div className="flex gap-2">
                              {getUrgencyBadge(req.urgency)}
                              <Badge className={`${status.bg} ${status.color}`}>
                                <StatusIcon className="h-3 w-3 mr-1" /> {status.label}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-lg font-semibold mt-2">{req.title}</p>
                          <p className="text-muted-foreground line-clamp-2 mt-1">{req.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-3">
                            <span>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</span>
                            <span>{getRequestTypeLabel(req.requestType)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-4 w-full lg:w-80">
                          {req.status === 'approved' && (
                            <div className="w-full text-right space-y-2">
                              <div className="flex justify-between text-lg font-bold">
                                <span className="text-primary">{formatVND(req.raisedAmount)}</span>
                                <span className="text-muted-foreground">/ {formatVND(req.requestedAmount)}</span>
                              </div>
                              <Progress value={progress} className="h-3" />
                              <p className="text-sm text-muted-foreground">{progress.toFixed(0)}% đạt được</p>
                            </div>
                          )}

                          <div className="flex gap-2 flex-wrap">
                            {isAdmin && req.status === 'pending' && (
                              <>
                                <Button size="sm" onClick={(e) => { e.stopPropagation(); handleApproveRequest(req._id); }}>
                                  <CheckCircle className="h-4 w-4 mr-1" /> Duyệt
                                </Button>
                                <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleRejectRequest(req._id); }}>
                                  <XCircle className="h-4 w-4 mr-1" /> Từ chối
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/assistance/${req._id}`); }}>
                              <Eye className="h-4 w-4 mr-1" /> Xem chi tiết
                            </Button>
                            {isAdmin && (
                              <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDeleteRequest(req._id); }}>
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

      {/* === PHẦN 2: DANH SÁCH QUYÊN GÓP === */}
      <div className="space-y-6 mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-7 w-7 text-green-600" />
            Các khoản quyên góp gần đây
          </h2>
          {isAdmin && (
            <Button onClick={exportDonationsToExcel} disabled={loadingDonations || donations.length === 0} size="sm" className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Xuất Excel
            </Button>
          )}
        </div>

        {loadingDonations ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Đang tải quyên góp...</span>
          </div>
        ) : donations.length === 0 ? (
          <Card className="text-center py-12">
            <Gift className="h-16 w-16 mx-auto mb-4 text-muted" />
            <p className="text-lg">Chưa có khoản quyên góp nào</p>
          </Card>
        ) : (
          <>
            <div className="max-h-96 overflow-y-auto border rounded-lg bg-card">
              <div className="space-y-4 p-4">
                {donations.map((d) => {
                  const donor = d.isAnonymous ? 'Ẩn danh' : d.userId?.fullName || 'Người dùng';
                  const target = d.assistanceId?.title || d.campaignId?.title || 'Quyên góp chung';
                  return (
                    <div
                      key={d._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                          <Gift className="h-6 w-6 text-white" />
                        </div>
                        <div className="min-w-0"> {/* Thêm min-w-0 để text bị cắt khi quá dài */}
                          <div className="font-semibold text-lg truncate">{donor}</div>
                          <div className="text-sm text-muted-foreground truncate">{target}</div>
                          {d.note && !d.isAnonymous && (
                            <div className="text-sm text-muted-foreground mt-1 italic truncate">
                              "{d.note}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="text-2xl font-bold text-green-600 whitespace-nowrap">
                          {d.amount.toLocaleString('vi-VN')} ₫
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(d.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="py-6 text-center">
                <p className="text-2xl font-bold text-green-800">
                  Tổng cộng: {totalDonations.toLocaleString('vi-VN')} ₫
                  <span className="block text-lg font-normal text-green-600 mt-1">
                    từ {donations.length} lượt quyên góp
                  </span>
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {!isAdmin && <ChatBubble />}

      <AssistanceRequestForm
        open={showRequestForm}
        onOpenChange={(open) => {
          setShowRequestForm(open);
          if (!open) fetchAssistance();
        }}
      />
    </motion.div>
  );
}