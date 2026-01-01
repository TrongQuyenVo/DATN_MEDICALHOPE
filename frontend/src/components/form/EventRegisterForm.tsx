/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { eventRegistrationsAPI } from '@/lib/api';
import ChatBubble from '@/pages/ChatbotPage';

interface Props {
  event: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EventRegisterForm({ event, open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: formData.get('fullName') as string,
      phone: formData.get('phone') as string,
      email: (formData.get('email') as string) || undefined,
    };

    setLoading(true);
    try {
      await eventRegistrationsAPI.register(event._id, data);
      toast.success(`Đã đăng ký "${event.title}" thành công! Chúng tôi sẽ liên hệ sớm ❤️`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl healthcare-heading">Đăng ký tham gia</DialogTitle>
          <p className="text-muted-foreground">{event.title}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Họ và tên *</Label>
            <Input name="fullName" required placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <Label>Số điện thoại *</Label>
            <Input name="phone" required type="tel" placeholder="0901234567" />
          </div>
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" placeholder="email@domain.com" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Đang xử lý...' : 'Xác nhận đăng ký'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
          </div>
        </form>
      </DialogContent>
      <ChatBubble />
    </Dialog>
  );
}