// components/FoodPointModal.tsx
import { useEffect } from "react";
import { X, MapPin, Phone, Clock, Users, Soup } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FoodPoint {
  _id: string;
  name: string;
  logo?: string;
  details?: {
    location?: string;
    phone?: string;
    schedule?: string;
    organizer?: string;
    description?: string;
    address?: string; // dùng để mở Google Maps
  };
}

interface FoodPointModalProps {
  point: FoodPoint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

export default function FoodPointModal({ point, open, onOpenChange }: FoodPointModalProps) {
  // Khóa body khi mở modal
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

  if (!point) return null;

  const img = point.logo
    ? (point.logo.startsWith('http') ? point.logo : `${API_SERVER}${point.logo}`)
    : "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&h=600&fit=crop";

  const googleMapsUrl = point.details?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point.details.address)}`
    : null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${open ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header ảnh */}
        <div className="relative h-64 flex-shrink-0">
          <img
            src={img}
            alt={point.name}
            className="w-full h-full object-cover"
            onError={(e) => e.currentTarget.src = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&h=600&fit=crop"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <Badge className="absolute bottom-5 left-6 text-lg px-6 py-2 bg-green-600 shadow-xl">
            Hàng ngày
          </Badge>

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
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-gray-400">
          <div className="flex items-center gap-4 mb-6">
            <Soup className="h-11 w-11 text-green-600 flex-shrink-0" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {point.details?.location || point.name}
            </h2>
          </div>

          {point.details?.description && (
            <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-2xl">
              <p className="text-gray-700 leading-relaxed text-base">
                {point.details.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {point.details?.address && (
              <div className="flex gap-5 p-6 bg-gradient-to-r from-blue-50 to-blue-100/60 rounded-2xl border border-blue-200">
                <div className="flex-shrink-0 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Địa chỉ</p>
                  <p className="text-gray-700 mt-2 leading-relaxed">{point.details.address}</p>
                </div>
              </div>
            )}

            {point.details?.phone && (
              <div className="flex gap-5 p-6 bg-gradient-to-r from-green-50 to-green-100/60 rounded-2xl border border-green-200">
                <div className="flex-shrink-0 w-14 h-14 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Liên hệ</p>
                  <a href={`tel:${point.details.phone}`} className="text-2xl font-bold text-green-600 hover:underline mt-2 block">
                    {point.details.phone}
                  </a>
                </div>
              </div>
            )}

            {point.details?.schedule && (
              <div className="flex gap-5 p-6 bg-gradient-to-r from-purple-50 to-purple-100/60 rounded-2xl border border-purple-200 sm:col-span-2">
                <div className="flex-shrink-0 w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Giờ phát đồ ăn</p>
                  <p className="text-gray-700 mt-2 whitespace-pre-line leading-relaxed">
                    {point.details.schedule}
                  </p>
                </div>
              </div>
            )}

            {point.details?.organizer && (
              <div className="flex gap-5 p-6 bg-gradient-to-r from-amber-50 to-amber-100/60 rounded-2xl border border-amber-200 sm:col-span-2">
                <div className="flex-shrink-0 w-14 h-14 bg-amber-600 rounded-full flex items-center justify-center shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Đơn vị tổ chức</p>
                  <p className="text-gray-700 mt-2 leading-relaxed">{point.details.organizer}</p>
                </div>
              </div>
            )}
          </div>

          {/* Nút hành động */}
          <div className="mt-10 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {googleMapsUrl && (
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-12 py-7 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex-1 max-w-sm"
                >
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    <MapPin className="mr-3 h-6 w-6" />
                    Chỉ đường Google Maps
                  </a>
                </Button>
              )}
              {point.details?.phone && (
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-12 py-7 bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex-1 max-w-sm"
                >
                  <a href={`tel:${point.details.phone}`}>
                    <Phone className="mr-3 h-6 w-6" />
                    Gọi hỏi thêm
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
    </div>
  );
}