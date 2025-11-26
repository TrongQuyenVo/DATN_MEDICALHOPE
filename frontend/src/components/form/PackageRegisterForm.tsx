// src/components/packages/PackageRegisterForm.tsx
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { registrationsAPI } from '@/lib/api';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowRight, Loader2, HeartHandshake, X, CheckCircle2 } from 'lucide-react';

const formSchema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ và tên'),
  phone: z.string().regex(/^0[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ (VD: 0901234567)'),
  dob: z.string().min(1, 'Vui lòng chọn ngày sinh'),
  gender: z.string().optional(),
  address: z.string().min(10, 'Địa chỉ quá ngắn'),
  healthIssue: z.string().min(20, 'Vui lòng mô tả chi tiết tình trạng bệnh'),
  commitment: z.literal(true, { errorMap: () => ({ message: 'Bạn phải cam kết thông tin chính xác' }) }),
});

type FormData = z.infer<typeof formSchema>;

interface PackageRegisterFormProps {
  pkg: { title: string; _id: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FilePreview = {
  field: 'identityCard' | 'povertyCertificate' | 'medicalRecords' | 'dischargePaper';
  file: File;
  url: string;
};

export default function PackageRegisterForm({ pkg, open, onOpenChange }: PackageRegisterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Quản lý file thật để submit
  const [fileLists, setFileLists] = useState<{
    identityCard: File[];
    povertyCertificate: File[];
    medicalRecords: File[];
    dischargePaper: File[];
  }>({
    identityCard: [],
    povertyCertificate: [],
    medicalRecords: [],
    dischargePaper: [],
  });

  // Preview ảnh
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // Dọn dẹp URL khi đóng hoặc unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [filePreviews]);

  // Xử lý chọn file
  const handleFileChange = (
    fieldName: keyof typeof fileLists,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) {
      // Xóa toàn bộ file của field này
      setFileLists(prev => ({ ...prev, [fieldName]: [] }));
      setFilePreviews(prev => prev.filter(p => p.field !== fieldName));
      return;
    }

    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF...)');
      return;
    }
    if (validFiles.length !== files.length) {
      toast.error('Một số file không phải ảnh đã bị bỏ qua');
    }

    // Dọn dẹp preview cũ
    filePreviews
      .filter(p => p.field === fieldName)
      .forEach(p => URL.revokeObjectURL(p.url));

    const newPreviews: FilePreview[] = validFiles.map(file => ({
      field: fieldName,
      file,
      url: URL.createObjectURL(file),
    }));

    setFilePreviews(prev => [
      ...prev.filter(p => p.field !== fieldName),
      ...newPreviews
    ]);

    setFileLists(prev => ({ ...prev, [fieldName]: validFiles }));
  };

  // Xóa 1 ảnh cụ thể
  const removePreview = (index: number) => {
    const preview = filePreviews[index];
    URL.revokeObjectURL(preview.url);

    setFilePreviews(prev => {
      const updated = prev.filter((_, i) => i !== index);
      const remainingFiles = updated
        .filter(p => p.field === preview.field)
        .map(p => p.file);

      setFileLists(prev => ({ ...prev, [preview.field]: remainingFiles }));
      return updated;
    });
  };

  const onSubmit = async (data: FormData) => {
    // Validate bắt buộc CMND
    if (fileLists.identityCard.length === 0) {
      toast.error('Vui lòng tải lên ít nhất 1 ảnh CMND/CCCD (mặt trước & sau)');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();

    formData.append('packageId', pkg._id);
    formData.append('packageTitle', pkg.title);
    formData.append('fullName', data.fullName);
    formData.append('phone', data.phone);
    formData.append('dob', data.dob);
    if (data.gender) formData.append('gender', data.gender);
    formData.append('address', data.address);
    formData.append('healthIssue', data.healthIssue);
    formData.append('commitment', 'true');

    // Gửi file
    const appendFiles = (fieldName: string, files: File[]) => {
      files.forEach(file => formData.append(fieldName, file));
    };

    appendFiles('identityCard', fileLists.identityCard);
    appendFiles('povertyCertificate', fileLists.povertyCertificate);
    appendFiles('medicalRecords', fileLists.medicalRecords);
    appendFiles('dischargePaper', fileLists.dischargePaper);

    try {
      await registrationsAPI.create(formData);
      toast.success('Đăng ký thành công! Chúng tôi sẽ liên hệ bạn sớm nhất', {
        icon: <HeartHandshake className="text-pink-500" />,
        duration: 7000,
      });
      reset();
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Lỗi đăng ký:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Form đăng ký */}
      <Dialog open={open && !showSuccessModal} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl">
          <div className="p-8 md:p-12 bg-white">
            <DialogHeader className="text-center mb-8">
              <DialogTitle className="text-3xl font-bold healthcare-heading">
                Đăng ký gói khám miễn phí
              </DialogTitle>
              <div className="mt-4 p-5 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border">
                <p className="text-lg font-bold text-emerald-700">Gói: {pkg.title}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Chúng tôi sẽ liên hệ bạn trong <strong>3-5 ngày làm việc</strong>
                </p>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Thông tin cá nhân */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Họ và tên <span className="text-red-500">*</span></Label>
                  <Input {...register('fullName')} placeholder="Nguyễn Văn A" className="mt-1" />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                </div>
                <div>
                  <Label>Số điện thoại <span className="text-red-500">*</span></Label>
                  <Input {...register('phone')} type="tel" placeholder="0901234567" className="mt-1" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <Label>Ngày sinh <span className="text-red-500">*</span></Label>
                  <Input {...register('dob')} type="date" className="mt-1" />
                  {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob.message}</p>}
                </div>
                <div>
                  <Label>Giới tính</Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Chọn giới tính" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nam">Nam</SelectItem>
                          <SelectItem value="Nữ">Nữ</SelectItem>
                          <SelectItem value="Khác">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div>
                <Label>Địa chỉ hiện tại <span className="text-red-500">*</span></Label>
                <Textarea {...register('address')} rows={3} placeholder="Ví dụ: 123 Đường ABC, Phường 4, Quận 5, TP.HCM" className="mt-1" />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>

              <div>
                <Label>Tình trạng sức khỏe <span className="text-red-500">*</span></Label>
                <Textarea
                  {...register('healthIssue')}
                  rows={5}
                  placeholder="Mô tả chi tiết bệnh lý, triệu chứng, đã khám ở đâu, kết quả..."
                  className="mt-1 resize-none"
                />
                {errors.healthIssue && <p className="text-red-500 text-xs mt-1">{errors.healthIssue.message}</p>}
              </div>

              {/* Upload files - ĐÃ SỬA HOÀN TOÀN */}
              <div className="p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <h3 className="font-semibold mb-5">Tải lên giấy tờ</h3>
                <div className="space-y-8">

                  {/* CMND/CCCD */}
                  <div>
                    <Label>CMND/CCCD (mặt trước & sau) <span className="text-red-500">*</span></Label>
                    <Input
                      key="identityCard"  // ← QUAN TRỌNG: key riêng để React tạo lại input
                      type="file"
                      accept="image/*"
                      multiple
                      className="mt-2"
                      onChange={(e) => handleFileChange('identityCard', e.target.files)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Có thể chọn nhiều ảnh cùng lúc</p>
                  </div>

                  {/* Giấy xác nhận hộ nghèo */}
                  <div>
                    <Label>Giấy xác nhận hộ nghèo (nếu có)</Label>
                    <Input
                      key="povertyCertificate"  // ← Key riêng
                      type="file"
                      accept="image/*"
                      multiple
                      className="mt-2"
                      onChange={(e) => handleFileChange('povertyCertificate', e.target.files)}
                    />
                  </div>

                  {/* Hồ sơ bệnh án */}
                  <div>
                    <Label>Hồ sơ bệnh án, kết quả xét nghiệm</Label>
                    <Input
                      key="medicalRecords"  // ← Key riêng
                      type="file"
                      accept="image/*"
                      multiple
                      className="mt-2"
                      onChange={(e) => handleFileChange('medicalRecords', e.target.files)}
                    />
                  </div>

                  {/* Giấy ra viện */}
                  <div>
                    <Label>Giấy ra viện (nếu có)</Label>
                    <Input
                      key="dischargePaper"  // ← Key riêng
                      type="file"
                      accept="image/*"
                      multiple
                      className="mt-2"
                      onChange={(e) => handleFileChange('dischargePaper', e.target.files)}
                    />
                  </div>

                </div>
              </div>

              {/* Preview tất cả ảnh đã chọn */}
              {filePreviews.length > 0 && (
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-300">
                  <h4 className="font-semibold text-blue-900 mb-4">
                    Đã chọn {filePreviews.length} ảnh
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filePreviews.map((preview, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={preview.url}
                          alt={preview.file.name}
                          className="w-full h-32 object-cover rounded-lg border-2 border-blue-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removePreview(idx)}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <p className="text-xs text-blue-700 mt-1 truncate text-center">
                          {preview.file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cam kết */}
              <Controller
                name="commitment"
                control={control}
                render={({ field }) => (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-300">
                    <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                    <label className="text-sm leading-relaxed cursor-pointer text-amber-900">
                      Tôi cam kết thông tin cung cấp là chính xác và đồng ý cho MedicalHope+ sử dụng để xét duyệt.
                    </label>
                  </div>
                )}
              />
              {errors.commitment && <p className="text-red-500 text-xs">{errors.commitment.message}</p>}

              {/* Nút */}
              <div className="flex justify-center gap-4 pt-8">
                <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 px-12 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Đang gửi hồ sơ...
                    </>
                  ) : (
                    <>
                      Gửi hồ sơ đăng ký
                      <ArrowRight className="ml-3 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal thành công */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <div className="text-center py-10">
            <CheckCircle2 className="w-24 h-24 text-emerald-500 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-emerald-700">Đăng ký thành công!</h2>
            <p className="text-2xl mt-4 text-emerald-600 font-medium">Gói: {pkg.title}</p>
            <p className="text-lg text-gray-700 mt-6">
              Cảm ơn bạn đã tin tưởng <strong className="text-emerald-600">MedicalHope+</strong>
            </p>
            <p className="text-base text-gray-600 mt-3">
              Chúng tôi sẽ liên hệ bạn trong vòng <strong>3-5 ngày làm việc</strong>
            </p>
          </div>

          <div className="mt-12 flex justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white text-xl px-16 py-8 rounded-full shadow-xl"
              onClick={() => {
                setFilePreviews([]);
                setFileLists({
                  identityCard: [],
                  povertyCertificate: [],
                  medicalRecords: [],
                  dischargePaper: [],
                });
                setShowSuccessModal(false);
                onOpenChange(false);
              }}
            >
              <HeartHandshake className="mr-3 h-8 w-8" />
              Hoàn tất - Cảm ơn bạn!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}