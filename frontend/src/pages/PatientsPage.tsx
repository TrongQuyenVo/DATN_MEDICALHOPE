import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, CheckCircle, Clock, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { patientsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';

interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  economicStatus: string;
  isVerified: boolean;
  registeredAt: string;
  lastVisit: string;
}

export default function PatientsPage() {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [newPatient, setNewPatient] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    age: '',
    condition: '',
    economicStatus: '',
  });

  if (!user) return null;

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientsAPI.getAll({ page, limit });
      const patientsData = Array.isArray(response.data.patients) ? response.data.patients : [];
      const mappedPatients: Patient[] = patientsData.map((patient: any) => ({
        id: patient._id,
        name: patient.userId?.fullName || 'Không xác định',
        age: patient.userId?.profile?.age || 0,
        condition: patient.medicalHistory?.[0]?.condition || 'Không xác định',
        economicStatus: patient.economicStatus || 'Không xác định',
        isVerified: patient.isVerified || false,
        registeredAt: patient.createdAt || new Date().toISOString(),
        lastVisit: patient.medicalHistory?.[0]?.diagnosedDate || 'Chưa có',
      }));
      setPatients(mappedPatients);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Không thể lấy danh sách bệnh nhân. Vui lòng thử lại.');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, limit]);

  const handleCreatePatient = async () => {
    try {
      await patientsAPI.create({
        fullName: newPatient.fullName,
        email: newPatient.email,
        phone: newPatient.phone,
        password: newPatient.password,
        age: parseInt(newPatient.age) || 0,
        condition: newPatient.condition,
        economicStatus: newPatient.economicStatus,
      });
      toast.success('Tạo bệnh nhân thành công');
      setOpenDialog(false);
      setNewPatient({ fullName: '', email: '', phone: '', password: '', age: '', condition: '', economicStatus: '' });
      fetchPatients();
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error('Không thể tạo bệnh nhân. Vui lòng thử lại.');
    }
  };

  const handleVerifyPatient = async (patientId: string) => {
    try {
      await patientsAPI.verify(patientId);
      toast.success('Xác thực bệnh nhân thành công');
      fetchPatients();
    } catch (error) {
      console.error('Error verifying patient:', error);
      toast.error('Không thể xác thực bệnh nhân. Vui lòng thử lại.');
    }
  };

  const getPageTitle = () => {
    switch (user.role) {
      case 'doctor':
        return 'Danh sách bệnh nhân';
      case 'admin':
        return 'Quản lý bệnh nhân';
      case 'charity_admin':
        return 'Bệnh nhân cần hỗ trợ';
      default:
        return 'Bệnh nhân';
    }
  };

  const getPageSubtitle = () => {
    switch (user.role) {
      case 'doctor':
        return 'Các bệnh nhân đã khám và theo dõi';
      case 'admin':
        return 'Quản lý thông tin và xác thực bệnh nhân';
      case 'charity_admin':
        return 'Danh sách bệnh nhân có hoàn cảnh khó khăn cần hỗ trợ';
      default:
        return 'Danh sách bệnh nhân';
    }
  };

  const getVisiblePatients = () => {
    switch (user.role) {
      case 'doctor':
        return patients.filter(patient => patient.condition !== 'Khỏe mạnh');
      case 'charity_admin':
        return patients.filter(
          patient => patient.economicStatus === 'very_poor' || patient.economicStatus === 'poor'
        );
      case 'admin':
        return patients;
      default:
        return [];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'very_poor': return 'bg-destructive text-destructive-foreground';
      case 'poor': return 'bg-warning text-warning-foreground';
      case 'middle': return 'bg-success text-success-foreground';
      case 'good': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const visiblePatients = getVisiblePatients();

  if (user.role === 'patient') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không có quyền truy cập</h2>
          <p className="text-muted-foreground">Bạn không có quyền xem trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="healthcare-heading text-3xl font-bold">{getPageTitle()}</h1>
          <p className="healthcare-subtitle">{getPageSubtitle()}</p>
        </div>
        {user.role === 'admin' && (
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="btn-healthcare">
                <UserPlus className="mr-2 h-4 w-4" />
                Thêm bệnh nhân
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm bệnh nhân mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Họ và tên"
                  value={newPatient.fullName}
                  onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                />
                <Input
                  placeholder="Số điện thoại"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                />
                <Input
                  type="password"
                  placeholder="Mật khẩu"
                  value={newPatient.password}
                  onChange={(e) => setNewPatient({ ...newPatient, password: e.target.value })}
                />
                <Input
                  placeholder="Tuổi"
                  type="number"
                  value={newPatient.age}
                  onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                />
                <Input
                  placeholder="Tình trạng bệnh"
                  value={newPatient.condition}
                  onChange={(e) => setNewPatient({ ...newPatient, condition: e.target.value })}
                />
                <Select
                  value={newPatient.economicStatus}
                  onValueChange={(value) => setNewPatient({ ...newPatient, economicStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tình trạng kinh tế" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very_poor">Rất nghèo</SelectItem>
                    <SelectItem value="poor">Nghèo</SelectItem>
                    <SelectItem value="middle">Trung bình</SelectItem>
                    <SelectItem value="good">Tốt</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCreatePatient} className="btn-healthcare">
                  Tạo bệnh nhân
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visiblePatients.length > 0 ? (
            visiblePatients.map((patient, index) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="healthcare-card">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={patient.userId?.avatar} />
                        <AvatarFallback className="text-lg bg-gradient-primary text-white">
                          {patient.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold healthcare-heading flex items-center">
                              {patient.name}
                              {patient.isVerified ? (
                                <CheckCircle className="ml-2 h-5 w-5 text-success" />
                              ) : (
                                <Clock className="ml-2 h-5 w-5 text-warning" />
                              )}
                            </h3>
                            <p className="text-muted-foreground">
                              {patient.age} tuổi • {patient.condition}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-muted-foreground">Đăng ký: </span>
                            <span className="font-medium">
                              {new Date(patient.registeredAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Khám gần nhất: </span>
                            <span className="font-medium">
                              {patient.lastVisit !== 'Chưa có' ? new Date(patient.lastVisit).toLocaleDateString('vi-VN') : 'Chưa có'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(patient.economicStatus)}>
                            {patient.economicStatus === 'very_poor' ? 'Rất nghèo' :
                              patient.economicStatus === 'poor' ? 'Nghèo' :
                                patient.economicStatus === 'middle' ? 'Trung bình' :
                                  patient.economicStatus === 'good' ? 'Tốt' : patient.economicStatus}
                          </Badge>

                          {user.role === 'admin' && !patient.isVerified && (
                            <Button
                              size="sm"
                              onClick={() => handleVerifyPatient(patient.id)}
                              className="btn-healthcare text-xs"
                            >
                              Xác thực
                            </Button>
                          )}

                          {user.role === 'charity_admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              Hỗ trợ
                            </Button>
                          )}

                          {user.role === 'doctor' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              Xem hồ sơ
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              {user.role === 'charity_admin'
                ? 'Không có bệnh nhân nào cần hỗ trợ'
                : 'Không có bệnh nhân nào'}
            </div>
          )}
        </div>
      )}

      {visiblePatients.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <Button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="btn-healthcare"
          >
            Trang trước
          </Button>
          <span>Trang {page} / {totalPages}</span>
          <Button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="btn-healthcare"
          >
            Trang sau
          </Button>
        </div>
      )}
      <ScrollToTop />
      <ChatBubble />
    </motion.div>
  );
}