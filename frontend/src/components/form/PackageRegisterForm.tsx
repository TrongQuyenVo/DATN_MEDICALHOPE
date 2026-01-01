// PackageRegisterForm.tsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import { registrationsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, User, Phone, Home, FileText, Camera, CheckCircle2 } from 'lucide-react';

interface Props {
  pkg: { title: string; _id: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PackageRegisterForm({ pkg, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [healthInfo, setHealthInfo] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selected = Array.from(e.target.files);
    const invalid = selected.filter(f => !f.type.startsWith('image/'));

    if (invalid.length > 0) {
      toast.error('Vui lòng chỉ chọn file ảnh (JPG, PNG)');
      return;
    }

    setFiles(selected);
    toast.success(`Đã chọn ${selected.length} ảnh`);
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) return toast.error('Vui lòng nhập họ và tên');
    if (!phone.trim()) return toast.error('Vui lòng nhập số điện thoại');
    if (!/^\d{9,11}$/.test(phone.replace(/\D/g, ''))) return toast.error('Số điện thoại không hợp lệ');
    if (files.length === 0) return toast.error('Vui lòng tải lên ít nhất 1 ảnh giấy tờ tùy thân');

    setLoading(true);

    const formData = new FormData();
    formData.append('packageId', pkg._id);
    formData.append('packageTitle', pkg.title);
    formData.append('fullName', fullName.trim());
    formData.append('phone', phone.trim());
    formData.append('address', address.trim() || 'Không có thông tin địa chỉ');
    formData.append('healthIssue', healthInfo.trim() || 'Chưa cung cấp thông tin bệnh lý');
    formData.append('commitment', 'true');

    files.forEach(file => {
      formData.append('identityCard', file);
      formData.append('medicalRecords', file);
    });

    try {
      await registrationsAPI.create(formData);
      setSuccess(true);
    } catch (error) {
      toast.error('Đã có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ hotline.');
    } finally {
      setLoading(false);
    }
  };

  // Thành công
  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md text-center">
          <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900">ĐĂNG KÝ THÀNH CÔNG</h2>
          <p className="mt-4 text-lg text-gray-700">Gói hỗ trợ: <span className="font-semibold">{pkg.title}</span></p>
          <p className="mt-6 text-gray-600 leading-relaxed">
            Chúng tôi đã nhận được thông tin.<br />
            Nhân viên sẽ liên hệ qua số điện thoại quý vị đã cung cấp trong vòng <strong>3–5 ngày làm việc</strong>.
          </p>
          <Button className="mt-8 w-full" size="lg" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Form chính
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-primary">
            ĐĂNG KÝ NHẬN HỖ TRỢ KHÁM CHỮA BỆNH MIỄN PHÍ
          </DialogTitle>
          <div className="text-center mt-3">
            <span className="inline-block px-6 py-2 bg-primary/10 text-primary font-semibold rounded-full">
              {pkg.title}
            </span>
          </div>
        </DialogHeader>

        <div className="mt-8 space-y-7">
          {/* Họ tên */}
          <div className="space-y-2">
            <Label className="w-5 h-5" />
            <Label className="text-base font-medium flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              Họ và tên người bệnh <span className="text-red-600">*</span>
            </Label>
            <Input
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 text-base"
            />
          </div>

          {/* Số điện thoại */}
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <Phone className="w-5 h-5 text-gray-600" />
              Số điện thoại liên lạc <span className="text-red-600">*</span>
            </Label>
            <Input
              type="tel"
              placeholder="0901234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              className="h-12 text-base"
            />
            <p className="text-sm text-gray-500">Chúng tôi sẽ gọi vào số này để xác nhận</p>
          </div>

          {/* Địa chỉ */}
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <Home className="w-5 h-5 text-gray-600" />
              Địa chỉ hiện tại (không bắt buộc)
            </Label>
            <Textarea
              placeholder="Ví dụ: Thôn 5, xã Ea Lê, huyện Ea Súp, tỉnh Đắk Lắk"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="resize-none"
            />
          </div>

          {/* Tình trạng bệnh */}
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Mô tả tình trạng bệnh (nếu có)
            </Label>
            <Textarea
              placeholder="Ví dụ: Ung thư phổi giai đoạn 3, đang chạy thận nhân tạo, có giấy xác nhận hộ nghèo..."
              rows={3}
              value={healthInfo}
              onChange={(e) => setHealthInfo(e.target.value)}
              className="resize-none"
            />
          </div>

          {/* Tải ảnh giấy tờ – phần quan trọng nhất */}
          <div className="rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Camera className="w-7 h-7 text-orange-700" />
              <h3 className="text-lg font-semibold text-orange-900">
                Tải lên giấy tờ tùy thân và hồ sơ bệnh án <span className="text-red-600">*</span>
              </h3>
            </div>

            <ul className="text-sm text-gray-700 space-y-1 mb-4 ml-10 list-disc">
              <li>Ít nhất 1 ảnh CMND/CCCD (mặt trước hoặc mặt sau)</li>
              <li>Nên kèm: giấy ra viện, sổ hộ nghèo, giấy chuyển tuyến, kết quả xét nghiệm...</li>
              <li>Ảnh phải rõ nét, không mờ, không bị che khuất</li>
            </ul>

            <input
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              className="block w-full text-sm file:mr-4 file:py-3 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-600 file:text-white hover:file:bg-orange-700"
              onChange={handleFileChange}
            />

            {files.length > 0 && (
              <div className="mt-4 rounded-lg bg-green-50 p-4 border border border-green-200">
                <p className="text-green-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Đã chọn {files.length} file ảnh
                </p>
              </div>
            )}
          </div>

          {/* Nút gửi */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !fullName || !phone || files.length === 0}
            className="w-full h-14 text-lg font-semibold"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang gửi thông tin...
              </>
            ) : (
              'GỬI ĐĂNG KÝ'
            )}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Sau khi gửi, chúng tôi sẽ liên hệ lại trong vòng <strong>3–5 ngày làm việc</strong>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}