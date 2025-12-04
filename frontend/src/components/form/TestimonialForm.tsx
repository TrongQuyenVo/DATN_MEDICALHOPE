// components/form/AnonymousTestimonialForm.tsx
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Heart } from 'lucide-react';
import ChatBubble from '@/pages/ChatbotPage';

interface Props {
  formData: { treatment: string; content: string };
  error: string | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onReset: () => void;
}

export default function AnonymousTestimonialForm({
  formData,
  error,
  onInputChange,
  onSubmit,
  onReset,
}: Props) {
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="treatment">Bạn đã được hỗ trợ chương trình nào? *</Label>
        <Input
          id="treatment"
          name="treatment"
          value={formData.treatment}
          onChange={onInputChange}
          placeholder="VD: Khám tim mạch miễn phí, Tặng kính cho trẻ em..."
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="content">Câu chuyện của bạn *</Label>
        <Textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={onInputChange}
          placeholder="Hãy chia sẻ cảm xúc, trải nghiệm của bạn khi nhận được sự giúp đỡ... (Hoàn toàn ẩn danh)"
          rows={6}
          className="mt-2 resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onReset}>
          Xóa hết
        </Button>
        <Button onClick={onSubmit} className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600">
          <Send className="h-4 w-4 mr-2" />
          Gửi lời cảm ơn
        </Button>
      </div>
      <ChatBubble />
    </div>
  );
}