import { useNavigate } from "react-router-dom";
import { Phone, Mail, MapPin, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/assets/logomedical.jpg"; // Thêm import logo

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="pt-10 pb-5 bg-background border-t">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* === PHẦN LOGO + MÔ TẢ === */}
          <div>
            <div className="flex items-center space-x-3 mb-5">
              {/* Logo thay thế icon Heart */}
              <div className="h-12 w-12 rounded-sm overflow-hidden shadow-lg bg-white flex-shrink-0">
                <img
                  src={Logo}
                  alt="MedicalHope+ Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <span className="healthcare-heading text-xl font-bold block">
                  MedicalHope+
                </span>
                <span className="text-xs text-muted-foreground">Y tế từ thiện</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              MedicalHope+ là nền tảng y tế từ thiện, kết nối bác sĩ, tình nguyện viên và bệnh nhân để mang lại dịch vụ y tế miễn phí, chất lượng cao.
            </p>
          </div>

          {/* Liên kết nhanh */}
          <div>
            <h3 className="font-bold text-lg mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2">
              <li>
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/")}>
                  Trang chủ
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/about")}>
                  Về chúng tôi
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/services")}>
                  Dịch vụ
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/programs")}>
                  Chương trình
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/organizations")}>
                  Tổ chức
                </Button>
              </li>
            </ul>
          </div>

          {/* Liên hệ */}
          <div>
            <h3 className="font-bold text-lg mb-4">Liên hệ</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm">1900 1234</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm">support@medicalhope.vn</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">123 Đường Nhân Ái, Quận 7, TP. Hồ Chí Minh</span>
              </li>
            </ul>
          </div>

          {/* Đăng ký tình nguyện */}
          <div>
            <h3 className="font-bold text-lg mb-4">Đăng ký tình nguyện</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tham gia cùng chúng tôi để mang lại hy vọng và sức khỏe cho cộng đồng.
            </p>
            <Button
              className="w-full bg-gradient-primary hover:bg-gradient-secondary text-white font-medium"
              onClick={() => navigate("/register")}
            >
              Đăng ký ngay
              <UserPlus className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MedicalHope+. Mọi quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
}