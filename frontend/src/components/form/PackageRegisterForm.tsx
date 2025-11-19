// src/components/packages/PackageRegisterForm.tsx
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { registrationsAPI } from '@/lib/api'; // DÙNG API CHUNG, CÓ INTERCEPTOR

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowRight, Loader2, HeartHandshake } from 'lucide-react';

const formSchema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ và tên'),
  phone: z.string().regex(/^0[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ (VD: 0901234567)'),
  dob: z.string().min(1, 'Vui lòng chọn ngày sinh'),
  gender: z.string().optional(),
  address: z.string().min(10, 'Địa chỉ quá ngắn'),
  healthIssue: z.string().min(20, 'Vui lòng mô tả chi tiết tình trạng bệnh'),
  identityCard: z.instanceof(FileList).refine((files) => files.length > 0, 'Bắt buộc tải lên CMND/CCCD'),
  povertyCertificate: z.instanceof(FileList).optional(),
  medicalRecords: z.instanceof(FileList).optional(),
  dischargePaper: z.instanceof(FileList).optional(),
  commitment: z.literal(true, { errorMap: () => ({ message: 'Bạn phải cam kết thông tin chính xác' }) }),
});

type FormData = z.infer<typeof formSchema>;

interface PackageRegisterFormProps {
  pkg: { title: string; _id: string }; // DÙNG _id, KHÔNG DÙNG value
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PackageRegisterForm({ pkg, open, onOpenChange }: PackageRegisterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const formData = new FormData();

    // Thông tin bắt buộc
    formData.append('packageId', pkg._id);        // ĐÚNG: _id
    formData.append('packageTitle', pkg.title);
    formData.append('fullName', data.fullName);
    formData.append('phone', data.phone);
    formData.append('dob', data.dob);
    if (data.gender) formData.append('gender', data.gender);
    formData.append('address', data.address);
    formData.append('healthIssue', data.healthIssue);
    formData.append('commitment', 'true');

    // File upload - xử lý an toàn
    const appendFiles = (fieldName: keyof FormData, files?: FileList) => {
      if (files && files.length > 0) {
        Array.from(files).forEach(file => formData.append(fieldName, file));
      }
    };

    appendFiles('identityCard', data.identityCard);
    appendFiles('povertyCertificate', data.povertyCertificate);
    appendFiles('medicalRecords', data.medicalRecords);
    appendFiles('dischargePaper', data.dischargePaper);

    try {
      await registrationsAPI.create(formData); // DÙNG API CHUNG → có token + toast tự động
      toast.success('Đăng ký thành công! Chúng tôi sẽ liên hệ bạn sớm nhất', {
        icon: <HeartHandshake />,
        duration: 6000,
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      // Lỗi đã được xử lý trong interceptor → không cần toast ở đây nữa
      console.error('Lỗi đăng ký:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

            {/* Upload files */}
            <div className="p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <h3 className="font-semibold mb-4">Tải lên giấy tờ</h3>
              <div className="space-y-4">
                <div>
                  <Label>CMND/CCCD (mặt trước & sau) <span className="text-red-500">*</span></Label>
                  <Input {...register('identityCard')} type="file" accept="image/*,.pdf" multiple className="mt-2" />
                  {errors.identityCard && <p className="text-red-500 text-xs mt-1">{errors.identityCard.message}</p>}
                </div>
                <div>
                  <Label>Giấy xác nhận hộ nghèo (nếu có)</Label>
                  <Input {...register('povertyCertificate')} type="file" accept="image/*,.pdf" multiple className="mt-2" />
                </div>
                <div>
                  <Label>Hồ sơ bệnh án, kết quả xét nghiệm</Label>
                  <Input {...register('medicalRecords')} type="file" accept="image/*,.pdf" multiple className="mt-2" />
                </div>
                <div>
                  <Label>Giấy ra viện (nếu có)</Label>
                  <Input {...register('dischargePaper')} type="file" accept="image/*,.pdf" multiple className="mt-2" />
                </div>
              </div>
            </div>

            {/* Cam kết */}
            <Controller
              name="commitment"
              control={control}
              render={({ field }) => (
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-300">
                  <Checkbox
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
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
                className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 px-12"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang gửi...
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
  );
}