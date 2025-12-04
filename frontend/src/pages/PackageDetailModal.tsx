/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/packages/PackageDetailModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import ChatBubble from './ChatbotPage';
import { useAuthStore } from '@/stores/authStore';

interface Package {
  _id: string;
  title: string;
  specialty: string;
  shortDescription: string;
  description: string;
  conditions: string;
  image: any;
  isActive?: boolean;
}

interface PackageDetailModalProps {
  pkg: Package | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: () => void;
}

export default function PackageDetailModal({
  pkg,
  open,
  onOpenChange,
  onRegister,
}: PackageDetailModalProps) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  if (!pkg) return null;

  const imageSrc = pkg.image ? getImageUrl(pkg.image) : '/placeholder-medical.jpg';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{pkg.title}</DialogTitle>
          <div className="inline-flex items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {pkg.specialty}
            </span>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div className="relative">
            <img
              src={imageSrc}
              alt={pkg.title}
              className="w-full h-64 object-cover rounded-2xl shadow-lg"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-medical.jpg';
              }}
            />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-lg text-blue-900 mb-2">Nội dung gói khám</h3>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{pkg.description}</p>
            </div>

            <div>
              <h3 className="font-bold text-lg text-orange-600 mb-2">Điều kiện</h3>
              <p className="text-muted-foreground italic leading-relaxed whitespace-pre-wrap">{pkg.conditions}</p>
            </div>
          </div>

          <Button
            size="lg"
            className="mx-auto flex items-center bg-gradient-to-r from-blue-600 to-green-600 text-white px-12 py-6 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all"
            onClick={() => {
              onOpenChange(false);
              onRegister();
            }}
          >
            Đăng ký nhận hỗ trợ ngay
            <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
      {!isAdmin && <ChatBubble />}

    </Dialog>
  );
}