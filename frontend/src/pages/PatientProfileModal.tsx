// components/patients/PatientProfileModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, UserCheck, Calendar, Phone, Mail, Home, DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import ChatBubble from './ChatbotPage';
import { useAuthStore } from '@/stores/authStore';

interface PatientProfileModalProps {
  patient: {
    id: string;
    name: string;
    age: number;
    condition: string;
    isSelfReported: boolean;
    economicStatus: string;
    isVerified: boolean;
    registeredAt: string;
    lastVisit: string;
    userId: {
      _id: string;
      fullName: string;
      email: string;
      phone: string;
      avatar?: string;
      profile?: {
        dateOfBirth?: string | Date;
        gender?: 'male' | 'female' | 'other';
        address?: string;
        insurance?: string;
        occupation?: string;
        condition?: string;
      };
    };
    medicalHistory?: Array<{
      condition: string;
      diagnosedDate: string;
      doctorNote?: string;
    }>;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// === XỬ LÝ AVATAR GIỐNG PROFILEPAGE ===
const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
const getAvatarUrl = (avatarPath: string | null | undefined): string | null => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath;
  const prefix = API_SERVER.endsWith('/') ? API_SERVER.slice(0, -1) : API_SERVER;
  return `${prefix}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
};

const getInitials = (name: string) => {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(word => word[0].toUpperCase())
    .slice(0, 2)
    .join('');
};

const getGenderText = (gender?: string) => {
  switch (gender) {
    case 'male': return 'Nam';
    case 'female': return 'Nữ';
    case 'other': return 'Khác';
    default: return 'Không xác định';
  }
};

const getEconomicText = (status: string) => {
  switch (status) {
    case 'very_poor': return 'Rất nghèo';
    case 'poor': return 'Nghèo';
    case 'middle': return 'Trung bình';
    case 'good': return 'Tốt';
    default: return 'Không xác định';
  }
};

export default function PatientProfileModal({ patient, open, onOpenChange }: PatientProfileModalProps) {
  const { user } = useAuthStore();
  const profile = patient.userId.profile;
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const url = getAvatarUrl(patient.userId.avatar);
    setAvatarPreview(url);
    setAvatarError(false);
  }, [patient.userId.avatar]);

  useEffect(() => {
    if (avatarPreview) {
      const img = new Image();
      img.onload = () => setAvatarError(false);
      img.onerror = () => setAvatarError(true);
      img.src = avatarPreview;
    }
  }, [avatarPreview]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold healthcare-heading">
            Hồ sơ bệnh nhân
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* THÔNG TIN CƠ BẢN */}
          <div className="flex items-start space-x-4">
            <div className="relative flex-shrink-0">
              <Avatar className="w-20 h-20 ring-2 ring-background shadow-lg">
                {!avatarError && avatarPreview ? (
                  <AvatarImage
                    src={avatarPreview}
                    alt={patient.name}
                    onError={() => setAvatarError(true)}
                  />
                ) : null}
                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {getInitials(patient.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold">{patient.name}</h3>
                {patient.isVerified ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <Clock className="h-5 w-5 text-warning" />
                )}
              </div>
              <p className="text-muted-foreground flex items-center gap-1 flex-wrap">
                {patient.age > 0 && <span>{patient.age} tuổi</span>}
                {patient.age > 0 && patient.condition !== 'Chưa cập nhật' && <span>•</span>}
                <span className="flex items-center gap-1">
                  {patient.condition}
                </span>
              </p>
            </div>
          </div>

          {/* THÔNG TIN LIÊN HỆ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{patient.userId.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">SĐT:</span>
              <span className="font-medium">{patient.userId.phone}</span>
            </div>
          </div>

          {/* HỒ SƠ CÁ NHÂN */}
          {profile && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold text-lg">Thông tin cá nhân</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Ngày sinh:</span>
                  <span className="font-medium">
                    {profile.dateOfBirth
                      ? format(new Date(profile.dateOfBirth), 'dd/MM/yyyy')
                      : 'Chưa cập nhật'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Giới tính:</span>
                  <span className="font-medium">{getGenderText(profile.gender)}</span>
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <Home className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Địa chỉ:</span>
                  <span className="font-medium">{profile.address || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Nghề nghiệp:</span>
                  <span className="font-medium">{profile.occupation || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Bảo hiểm:</span>
                  <span className="font-medium">{profile.insurance || 'Chưa cập nhật'}</span>
                </div>
              </div>
            </div>
          )}

          {/* LỊCH SỬ KHÁM */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-semibold text-lg">Lịch sử khám</h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đăng ký:</span>
                <span className="font-medium">
                  {new Date(patient.registeredAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Khám gần nhất:</span>
                <span className="font-medium">
                  {patient.lastVisit !== 'Chưa có'
                    ? new Date(patient.lastVisit).toLocaleDateString('vi-VN')
                    : 'Chưa có'}
                </span>
              </div>
            </div>
          </div>

          {/* TÌNH TRẠNG KINH TẾ */}
          <div className="flex items-center justify-between border-t pt-4">
            <span className="font-medium">Tình trạng kinh tế:</span>
            <Badge className={
              patient.economicStatus === 'very_poor' ? 'bg-destructive text-destructive-foreground' :
                patient.economicStatus === 'poor' ? 'bg-warning text-warning-foreground' :
                  patient.economicStatus === 'middle' || patient.economicStatus === 'good' ? 'bg-success text-success-foreground' :
                    'bg-muted text-muted-foreground'
            }>
              {getEconomicText(patient.economicStatus)}
            </Badge>
          </div>
        </div>
      </DialogContent>
      {!isAdmin && <ChatBubble />}
    </Dialog>
  );
}