/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/support/AllSupportRequests.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, ChevronLeft, ChevronRight, Heart, Activity
} from 'lucide-react';
import { assistanceAPI } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DonationForm from '@/components/form/DonationForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Footer from '@/components/layout/Footer';
import ChatBubble from './ChatbotPage';
import NavHeader from '@/components/layout/NavHeader';
import { Badge } from '@/components/ui/badge';

interface AssistanceRequest {
  _id: string;
  patientId: {
    userId: {
      fullName: string;
      phone: string;
      profile: {
        dateOfBirth: string;
        address: string;
      };
    };
  };
  title: string;
  description: string;
  medicalCondition: string;
  requestedAmount: number;
  raisedAmount: number;
  urgency: string;
  status: string;
}

export default function AllSupportRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssistanceId, setSelectedAssistanceId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await assistanceAPI.getPublic();
      if (response.data && Array.isArray(response.data.data)) {
        setRequests(response.data.data);
      } else {
        setRequests([]);
      }
      setLoading(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lỗi khi tải danh sách yêu cầu hỗ trợ');
      setLoading(false);
      setRequests([]);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const paginatedRequests = requests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header ở trên cùng */}
      <NavHeader />
      {/* Hero Section - Bắt đầu từ đỉnh */}
      <div className="bg-gradient-to-r from-primary/90 to-secondary text-white py-32 pt-40">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2 mb-6">
              <DollarSign className="h-5 w-5" />
              <span className="text-sm font-medium">Tất cả yêu cầu hỗ trợ</span>
            </div>
            <h1 className="text-5xl font-bold mb-4">
              Chung Tay Giúp Đỡ
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Mỗi đóng góp của bạn là một tia hy vọng cho những bệnh nhân đang cần sự giúp đỡ.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground">Đang tải yêu cầu...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 text-lg">{error}</p>
            <Button onClick={fetchRequests} className="mt-4">
              Thử lại
            </Button>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">Hiện chưa có yêu cầu hỗ trợ nào.</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {paginatedRequests.map((request, index) => (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  {/* CARD CÓ THỂ CLICK ĐỂ VÀO CHI TIẾT */}
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/assistance/${request._id}`)}
                  >
                    <Card className="healthcare-card h-full group-hover:shadow-2xl group-hover:border-primary transition-all duration-300 border-2">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                              {request.patientId.userId.fullName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Tuổi: {request.patientId.userId.profile?.dateOfBirth
                                ? calculateAge(request.patientId.userId.profile.dateOfBirth)
                                : 'N/A'}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {request.patientId.userId.profile?.address || 'Chưa cung cấp'}
                            </p>
                          </div>
                          <Badge
                            variant={
                              request.urgency === 'critical' ? 'destructive' :
                                request.urgency === 'high' ? 'default' :
                                  request.urgency === 'medium' ? 'secondary' : 'outline'
                            }
                          >
                            {request.urgency === 'critical' ? 'Khẩn cấp' :
                              request.urgency === 'high' ? 'Cao' :
                                request.urgency === 'medium' ? 'Trung bình' : 'Thấp'}
                          </Badge>
                        </div>

                        <div className="mb-4">
                          <p className="font-semibold text-primary text-sm mb-1">{request.medicalCondition}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Cần hỗ trợ:</span>
                              <span className="font-bold">{formatVND(request.requestedAmount)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min((request.raisedAmount / request.requestedAmount) * 100, 100)}%`
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 text-right">
                              Đã đạt: {((request.raisedAmount / request.requestedAmount) * 100).toFixed(0)}%
                            </p>
                          </div>

                          {/* NÚT ỦNG HỘ - NGĂN CHUYỂN TRANG */}
                          <Button
                            className="w-full bg-red-500 hover:bg-red-600 text-white"
                            onClick={(e) => {
                              e.stopPropagation(); // NGĂN CHUYỂN TRANG
                              setSelectedAssistanceId(request._id); // MỞ MODAL
                            }}
                          >
                            <Heart className="h-4 w-4 mr-2" />
                            Ủng hộ ngay
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <ChatBubble />
      <Footer />

      {/* Donation Form Modal */}
      <DonationForm
        open={!!selectedAssistanceId}
        onOpenChange={(open) => !open && setSelectedAssistanceId(null)}
        assistanceId={selectedAssistanceId || undefined}
      />
    </div>
  );
}