// components/BusPartnerModal.tsx
import { useEffect } from "react";
import { X, MapPin, Phone, Bus, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ChatBubble from "./ChatbotPage";

interface Partner {
  _id: string;
  name: string;
  logo?: string;
  details?: {
    description?: string;
    location?: string;
    phone?: string;
    schedule?: string;
    routes?: string;
    capacity?: string;
    contactPerson?: string;
  };
}

interface BusPartnerModalProps {
  partner: Partner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

export default function BusPartnerModal({ partner, open, onOpenChange }: BusPartnerModalProps) {

  useEffect(() => {
    if (!open) {
      // Khi đóng modal → khôi phục scroll
      const saved = document.documentElement.getAttribute('data-scroll-y');
      if (saved !== null) {
        window.scrollTo(0, Number(saved));
      }

      document.documentElement.removeAttribute('data-scroll-y');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';

      return;
    }

    // Khi mở modal → lưu vị trí hiện tại và khóa scroll
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
    document.documentElement.setAttribute('data-scroll-y', String(currentScrollY));

    document.body.style.position = 'fixed';
    document.body.style.top = `-${currentScrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    // Cleanup khi component bị unmount (rất quan trọng!)
    return () => {
      const saved = document.documentElement.getAttribute('data-scroll-y');
      if (saved !== null) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, Number(saved));
        document.documentElement.removeAttribute('data-scroll-y');
      }
    };
  }, [open]);

  if (!partner) return null;

  const img = partner.logo
    ? (partner.logo.startsWith('http') ? partner.logo : `${API_SERVER}${partner.logo}`)
    : "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=600&fit=crop";

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${open ? 'block' : 'hidden'}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header ảnh */}
        <div className="relative h-60 flex-shrink-0">
          <img
            src={img}
            alt={partner.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=600&fit=crop";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <Badge className="absolute bottom-5 left-6 text-lg px-6 py-2 bg-orange-600 shadow-xl">
            Miễn phí 100%
          </Badge>

          {/* Nút đóng duy nhất */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-11 w-11 rounded-full bg-white/25 hover:bg-white/40 text-white backdrop-blur-md shadow-lg hover:scale-110 transition"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-7 w-7" />
          </Button>
        </div>

        {/* Nội dung cuộn */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <Bus className="h-11 w-11 text-orange-600 flex-shrink-0" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {partner.name}
            </h2>
          </div>

          {/* Mô tả */}
          {partner.details?.description && (
            <div className="mb-8 p-6 bg-orange-50 border border-orange-200 rounded-2xl">
              <p className="text-gray-700 leading-relaxed text-base">
                {partner.details.description}
              </p>
            </div>
          )}

          {/* Thông tin chi tiết */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {partner.details?.location && (
              <div className="flex gap-5 p-6 bg-gradient-to-r from-blue-50 to-blue-100/60 rounded-2xl border border-blue-200">
                <div className="flex-shrink-0 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Khu vực hoạt động</p>
                  <p className="text-gray-700 mt-2 leading-relaxed">{partner.details.location}</p>
                </div>
              </div>
            )}

            {partner.details?.phone && (
              <div className="flex gap-5 p-6 bg-gradient-to-r from-green-50 to-green-100/60 rounded-2xl border border-green-200">
                <div className="flex-shrink-0 w-14 h-14 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Liên hệ khẩn cấp</p>
                  <a
                    href={`tel:${partner.details.phone}`}
                    className="text-2xl font-bold text-green-600 hover:underline mt-2 block"
                  >
                    {partner.details.phone}
                  </a>
                </div>
              </div>
            )}

            {partner.details?.schedule && (
              <div className="flex gap-5 p-6 bg-gradient-to-r from-purple-50 to-purple-100/60 rounded-2xl border border-purple-200 sm:col-span-2">
                <div className="flex-shrink-0 w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Lịch hoạt động</p>
                  <p className="text-gray-700 mt-2 whitespace-pre-line leading-relaxed">
                    {partner.details.schedule}
                  </p>
                </div>
              </div>
            )}

            {partner.details?.routes && (
              <div className="flex gap-5 p-6 bg-gradient-to-r from-amber-50 to-amber-100/60 rounded-2xl border border-amber-200 sm:col-span-2">
                <div className="flex-shrink-0 w-14 h-14 bg-amber-600 rounded-full flex items-center justify-center shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Tuyến đường thường xuyên</p>
                  <p className="text-gray-700 mt-2 leading-relaxed">{partner.details.routes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Nút hành động cố định dưới cùng */}
          <div className="mt-10 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {partner.details?.phone && (
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-12 py-7 bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex-1 max-w-sm"
                >
                  <a href={`tel:${partner.details.phone}`}>
                    <Phone className="mr-3 h-6 w-6" />
                    Gọi ngay hỗ trợ
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-12 py-7 border-2 font-bold text-lg flex-1 max-w-sm"
                onClick={() => onOpenChange(false)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      </div>
      <ChatBubble />
    </div>
  );
}