import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Upload, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { assistanceAPI } from '@/lib/api';
import ChatBubble from '@/pages/ChatbotPage';
import { useAuthStore } from '@/stores/authStore';

interface AssistanceRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  requestType: string;
  title: string;
  description: string;
  requestedAmount: number;
  urgency: string;
  contactPhone: string;
  medicalCondition: string;
  supportStartDate: string;
  supportEndDate: string;
}

const schema = yup.object({
  requestType: yup.string().required('Vui lòng chọn loại hỗ trợ'),
  title: yup.string().required('Vui lòng nhập tiêu đề').min(10, 'Tiêu đề phải có ít nhất 10 ký tự'),
  description: yup.string().required('Vui lòng mô tả chi tiết').min(50, 'Mô tả phải có ít nhất 50 ký tự'),
  requestedAmount: yup.number().required('Vui lòng nhập số tiền cần hỗ trợ').min(100000, 'Số tiền tối thiểu là 100,000 VNĐ'),
  urgency: yup.string().required('Vui lòng chọn mức độ khẩn cấp'),
  contactPhone: yup.string().required('Vui lòng nhập số điện thoại liên hệ'),
  medicalCondition: yup.string().required('Vui lòng mô tả tình trạng bệnh lý'),
  supportStartDate: yup.date().required('Vui lòng chọn ngày bắt đầu'),
  supportEndDate: yup.date()
    .required('Vui lòng chọn ngày kết thúc')
    .min(yup.ref('supportStartDate'), 'Ngày kết thúc phải sau ngày bắt đầu'),
});

export default function AssistanceRequestForm({ open, onOpenChange }: AssistanceRequestFormProps) {
  const { t } = useTranslation();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<FormData>({
    resolver: yupResolver(schema)
  });

  const watchedRequestType = watch('requestType');

  const requestTypes = [
    { value: 'medical_treatment', label: 'Điều trị y tế' },
    { value: 'medication', label: 'Thuốc men' },
    { value: 'equipment', label: 'Thiết bị y tế' },
    { value: 'surgery', label: 'Phẫu thuật' },
    { value: 'emergency', label: 'Cấp cứu khẩn cấp' },
    { value: 'rehabilitation', label: 'Phục hồi chức năng' },
    { value: 'other', label: 'Khác' }
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Bình thường', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Trung bình', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' },
    { value: 'critical', label: 'Rất khẩn cấp', color: 'bg-red-200 text-red-900' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

      if (!isValidType) {
        toast.error(`File ${file.name} không được hỗ trợ`);
        return false;
      }

      if (!isValidSize) {
        toast.error(`File ${file.name} quá lớn (tối đa 5MB)`);
        return false;
      }

      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // 📤 TẠO FormData ĐỂ GỬI FILES + DATA
      const formData = new FormData();
      formData.append('requestType', data.requestType);
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('requestedAmount', data.requestedAmount.toString());
      formData.append('urgency', data.urgency);
      formData.append('contactPhone', data.contactPhone);
      formData.append('medicalCondition', data.medicalCondition);
      formData.append('supportStartDate', data.supportStartDate);
      formData.append('supportEndDate', data.supportEndDate);

      // 📎 THÊM FILES
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      // 🚀 GỌI API THẬT
      await assistanceAPI.create(formData);

      toast.success('Yêu cầu hỗ trợ đã được gửi thành công!');
      reset();
      setAttachments([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="healthcare-heading">Tạo yêu cầu hỗ trợ y tế</DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết để chúng tôi có thể hỗ trợ bạn tốt nhất
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Request Type */}
          <div className="space-y-2">
            <Label htmlFor="requestType">Loại hỗ trợ *</Label>
            <Select onValueChange={(value) => setValue('requestType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại hỗ trợ cần thiết" />
              </SelectTrigger>
              <SelectContent>
                {requestTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.requestType && (
              <p className="text-sm text-destructive">{errors.requestType.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề yêu cầu *</Label>
            <Input
              id="title"
              placeholder="Ví dụ: Cần hỗ trợ chi phí phẫu thuật tim..."
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Medical Condition */}
          <div className="space-y-2">
            <Label htmlFor="medicalCondition">Tình trạng bệnh lý *</Label>
            <Textarea
              id="medicalCondition"
              placeholder="Mô tả chi tiết về tình trạng sức khỏe, bệnh lý hiện tại..."
              rows={3}
              {...register('medicalCondition')}
            />
            {errors.medicalCondition && (
              <p className="text-sm text-destructive">{errors.medicalCondition.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả chi tiết yêu cầu *</Label>
            <Textarea
              id="description"
              placeholder="Mô tả chi tiết về tình huống, lý do cần hỗ trợ, kế hoạch điều trị..."
              rows={4}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Requested Amount */}
          <div className="space-y-2">
            <Label htmlFor="requestedAmount">Số tiền cần hỗ trợ (VNĐ) *</Label>
            <Input
              id="requestedAmount"
              type="number"
              placeholder="Ví dụ: 50000000"
              {...register('requestedAmount')}
            />
            {errors.requestedAmount && (
              <p className="text-sm text-destructive">{errors.requestedAmount.message}</p>
            )}
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <Label htmlFor="urgency">Mức độ khẩn cấp *</Label>
            <Select onValueChange={(value) => setValue('urgency', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn mức độ khẩn cấp" />
              </SelectTrigger>
              <SelectContent>
                {urgencyLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div className="flex items-center">
                      <Badge className={`${level.color} mr-2`}>
                        {level.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.urgency && (
              <p className="text-sm text-destructive">{errors.urgency.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supportStartDate">Ngày bắt đầu nhận hỗ trợ *</Label>
              <Input
                id="supportStartDate"
                type="date"
                {...register('supportStartDate')}
              />
              {errors.supportStartDate && (
                <p className="text-sm text-destructive">{errors.supportStartDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEndDate">Ngày kết thúc nhận hỗ trợ *</Label>
              <Input
                id="supportEndDate"
                type="date"
                {...register('supportEndDate')}
              />
              {errors.supportEndDate && (
                <p className="text-sm text-destructive">{errors.supportEndDate.message}</p>
              )}
            </div>
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Số điện thoại liên hệ *</Label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="0987654321"
              {...register('contactPhone')}
            />
            {errors.contactPhone && (
              <p className="text-sm text-destructive">{errors.contactPhone.message}</p>
            )}
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <Label>Tài liệu đính kèm (tùy chọn)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Tải lên hồ sơ bệnh án, đơn thuốc, kết quả xét nghiệm...
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Chọn tệp
                </Button>
              </div>
            </div>

            {/* Uploaded Files */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Tệp đã tải lên:</Label>
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="btn-healthcare"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
          </div>
        </form>
      </DialogContent>
      {!isAdmin && <ChatBubble />}

    </Dialog>
  );
}