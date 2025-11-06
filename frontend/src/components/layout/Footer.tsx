import { useState } from "react";
import { Heart, Phone, Mail, MapPin, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="pt-10 pb-5 bg-background border-t">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="healthcare-heading text-xl font-bold">MedicalHope+</span>
            </div>
            <p className="text-sm text-muted-foreground">
              MedicalHope+ là nền tảng y tế từ thiện, kết nối bác sĩ, tình nguyện viên và bệnh nhân để mang lại dịch vụ y tế miễn phí, chất lượng cao.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Liên kết nhanh</h3>
            <ul>
              <li><Button variant="link" className="p-0" onClick={() => navigate('/')}>Trang chủ</Button></li>
              <li><Button variant="link" className="p-0" onClick={() => navigate('/about')}>Về chúng tôi</Button></li>
              <li><Button variant="link" className="p-0" onClick={() => navigate('/services')}>Dịch vụ</Button></li>
              <li><Button variant="link" className="p-0" onClick={() => navigate('/programs')}>Chương trình</Button></li>
              <li><Button variant="link" className="p-0" onClick={() => navigate('/organizations')}>Tổ chức</Button></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Liên hệ</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm">1900 1234</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm">support@healthcareplus.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm">123 Đường Nhân Ái, TP. Hồ Chí Minh</span>
              </li>
            </ul>
          </div>

          {/* Volunteer Registration */}
          <div>
            <h3 className="font-bold text-lg mb-4">Đăng ký tình nguyện</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Tham gia cùng chúng tôi để mang lại hy vọng và sức khỏe cho cộng đồng.
            </p>
            <Button
              className="bg-gradient-primary text-white hover:bg-gradient-secondary w-full"
              onClick={() => navigate('/register')}
            >
              Đăng ký ngay
              <UserPlus className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          &copy; 2025 MedicalHope+. Mọi quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
}