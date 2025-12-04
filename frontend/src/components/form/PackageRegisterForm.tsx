// PackageSimpleRegisterForm.tsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import { registrationsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, Phone, User, Home, Camera, CheckCircle } from 'lucide-react';
import ChatBubble from '@/pages/ChatbotPage';

interface Props {
  pkg: { title: string; _id: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PackageSimpleRegisterForm({ pkg, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Chỉ cần 4 trường bắt buộc + ảnh
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [health, setHealth] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.some(f => !f.type.startsWith('image/'))) {
        toast.error('Chỉ chọn ảnh thôi nhé!');
        return;
      }
      setPhotos(files);
      toast.success(`Đã chọn ${files.length} ảnh`);
    }
  };

  const submit = async () => {
    if (!name.trim()) return toast.error('Nhớ ghi tên nhé!');
    if (!phone.trim()) return toast.error('Cần số điện thoại để liên lạc');
    if (photos.length === 0) return toast.error('Chụp ít nhất 1 ảnh CMND/CCCD');

    setLoading(true);
    const formData = new FormData();
    formData.append('packageId', pkg._id);
    formData.append('packageTitle', pkg.title);
    formData.append('fullName', name);
    formData.append('phone', phone);
    formData.append('address', address || 'Không nhớ rõ địa chỉ');
    formData.append('healthIssue', health || 'Bệnh nặng, cần giúp đỡ');
    formData.append('commitment', 'true');

    photos.forEach(photo => {
      formData.append('identityCard', photo);
      formData.append('medicalRecords', photo); // gộp chung cho dễ
    });

    try {
      await registrationsAPI.create(formData);
      setSuccess(true);
      toast.success('Gửi thành công rồi! Chúng tôi sẽ gọi lại sớm');
    } catch (err) {
      toast.error('Gửi bị lỗi, chụp lại ảnh rõ hơn nhé');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="text-center p-10">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-green-600">GỬI THÀNH CÔNG!</h2>
          <p className="text-xl mt-4">Gói: {pkg.title}</p>
          <p className="text-lg mt-6">Chúng tôi sẽ gọi cho bác trong 3-5 ngày</p>
          <Button className="mt-8 text-xl px-12 py-8" onClick={() => onOpenChange(false)}>
            Đóng lại
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
            ĐĂNG KÝ KHÁM MIỄN PHÍ
          </h2>
          <p className="text-center text-lg font-semibold mb-6 bg-yellow-100 py-3 rounded-lg">
            Gói: {pkg.title}
          </p>

          <div className="space-y-6">
            {/* 1. Tên */}
            <div>
              <Label className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" /> Họ tên người bệnh
              </Label>
              <Input
                className="text-lg h-14 mt-2"
                placeholder="Ví dụ: Nguyễn Thị Hoa"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* 2. Điện thoại - quan trọng nhất */}
            <div>
              <Label className="text-lg flex items-center gap-2 text-red-600 font-bold">
                <Phone className="w-5 h-5" /> Số điện thoại (rất quan trọng!)
              </Label>
              <Input
                type="tel"
                className="text-lg h-14 mt-2 text-red-600 font-bold"
                placeholder="0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-sm text-gray-600 mt-1">Chúng tôi sẽ gọi số này</p>
            </div>

            {/* 3. Địa chỉ (không bắt buộc) */}
            <div>
              <Label className="text-lg flex items-center gap-2">
                <Home className="w-5 h-5" /> Địa chỉ (xã/huyện/tỉnh cũng được)
              </Label>
              <Input
                className="text-lg h-14 mt-2"
                placeholder="Ví dụ: Xã Ea Lê, Huyện Ea Súp, Đắk Lắk"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* 4. Tình trạng bệnh (không bắt buộc) */}
            <div>
              <Label className="text-lg">Bệnh gì vậy bác? (nếu nhớ thì ghi)</Label>
              <Input
                className="text-lg h-14 mt-2"
                placeholder="Ví dụ: Ung thư, tim mạch, chạy thận..."
                value={health}
                onChange={(e) => setHealth(e.target.value)}
              />
            </div>

            {/* 5. CHỤP ẢNH GIẤY TỜ - phần quan trọng nhất */}
            <div className="bg-orange-50 p-6 rounded-xl border-2 border-orange-300">
              <Label className="text-xl font-bold text-orange-800 flex items-center gap-3">
                <Camera className="w-8 h-8" />
                BƯỚC QUAN TRỌNG: CHỤP ẢNH GIẤY TỜ
              </Label>
              <p className="text-lg mt-3 text-orange-900">
                Chụp ít nhất 1 ảnh CMND/CCCD (mặt trước hoặc sau đều được)
              </p>
              <p className="text-sm mt-2">Có thể chụp thêm: giấy nghèo, bệnh án, giấy ra viện...</p>

              <div className="mt-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  className="block w-full text-lg file:mr-4 file:py-4 file:px-6 file:rounded-full file:border-0 file:text-lg file:font-semibold file:bg-orange-600 file:text-white hover:file:bg-orange-700"
                  onChange={handlePhotoChange}
                />
              </div>

              {photos.length > 0 && (
                <div className="mt-4 p-4 bg-green-100 rounded-lg">
                  <p className="text-green-800 font-bold">
                    Đã chọn {photos.length} ảnh ✓
                  </p>
                </div>
              )}
            </div>

            {/* Nút gửi */}
            <Button
              onClick={submit}
              disabled={loading || !name || !phone || photos.length === 0}
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-blue-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "GỬI ĐĂNG KÝ NGAY"
              )}
            </Button>

            <p className="text-center text-sm text-gray-600 mt-4">
              Gửi xong chúng tôi sẽ gọi lại trong 3-5 ngày làm việc
            </p>
          </div>
        </div>
      </DialogContent>
      <ChatBubble />
    </Dialog>
  );
}