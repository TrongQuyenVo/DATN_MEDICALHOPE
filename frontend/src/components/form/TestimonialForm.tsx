import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface TestimonialFormData {
  name: string;
  age: string;
  location: string;
  treatment: string;
  content: string;
}

interface TestimonialFormProps {
  formData: TestimonialFormData;
  error: string | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onReset: () => void;
}

export default function TestimonialForm({
  formData,
  error,
  onInputChange,
  onSubmit,
  onReset,
}: TestimonialFormProps) {
  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Họ và tên *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={onInputChange}
            placeholder="VD: Nguyễn Văn A"
            required
          />
        </div>
        <div>
          <Label htmlFor="age">Tuổi *</Label>
          <Input
            id="age"
            name="age"
            type="text"
            value={formData.age}
            onChange={onInputChange}
            placeholder="VD: 45 tuổi"
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="location">Địa điểm *</Label>
        <Input
          id="location"
          name="location"
          value={formData.location}
          onChange={onInputChange}
          placeholder="VD: Hà Nội"
          required
        />
      </div>
      <div>
        <Label htmlFor="treatment">Chương trình được khám miễn phí *</Label>
        <Input
          id="treatment"
          name="treatment"
          value={formData.treatment}
          onChange={onInputChange}
          placeholder="VD: Khám tim miễn phí"
          required
        />
      </div>
      <div>
        <Label htmlFor="content">Câu chuyện của bạn *</Label>
        <Textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={onInputChange}
          placeholder="Chia sẻ trải nghiệm của bạn..."
          rows={5}
          required
        />
      </div>
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onReset}>
          Xóa
        </Button>
        <Button className="btn-healthcare" onClick={onSubmit}>
          <Send className="h-4 w-4 mr-2" />
          Gửi câu chuyện
        </Button>
      </div>
    </div>
  );
}