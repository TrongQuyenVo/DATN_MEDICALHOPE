import React from 'react';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';

export default function DonationsPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  // Danh sách các khoản quyên góp
  const recentDonations = [
    {
      id: 1,
      donor: 'Nguyễn Văn A',
      amount: 500000,
      campaign: 'Hỗ trợ phẫu thuật tim cho bé Mai',
      time: '2025-10-22 15:00',
      isAnonymous: false,
      note: 'Chúc bé Mai sớm khỏe mạnh!',
    },
    {
      id: 2,
      donor: 'Ẩn danh',
      amount: 1000000,
      campaign: 'Mua thiết bị y tế cho bệnh viện',
      time: '2025-10-22 13:00',
      isAnonymous: true,
      note: null, // Không hiển thị ghi chú cho ẩn danh
    },
    {
      id: 3,
      donor: 'Công ty ABC',
      amount: 5000000,
      campaign: 'Hỗ trợ điều trị ung thư cho chú Nam',
      time: '2025-10-21 09:00',
      isAnonymous: false,
      note: 'Hỗ trợ chi phí điều trị cho chú Nam.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="healthcare-card">
        <CardHeader>
          <CardTitle className="healthcare-heading">Danh sách quyên góp</CardTitle>
          <CardDescription>Các khoản quyên góp gần đây từ cộng đồng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentDonations.map((donation) => (
              <div
                key={donation.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-success flex items-center justify-center">
                    <Gift className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {donation.isAnonymous ? 'Ẩn danh' : donation.donor}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {donation.campaign}
                    </div>
                    {!donation.isAnonymous && donation.note && (
                      <div className="text-sm text-muted-foreground">
                        Ghi chú: {donation.note}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-success">
                    {donation.amount.toLocaleString('vi-VN')} VNĐ
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(donation.time).toLocaleString('vi-VN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <ScrollToTop />
      <ChatBubble />
    </motion.div>
  );
}