/* eslint-disable @typescript-eslint/no-explicit-any */
// components/donations/DonationsPage.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';
import { donationsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Donation {
  _id: string;
  userId: {
    fullName: string;
    email: string;
  };
  amount: number;
  campaignId?: {
    title: string;
  };
  assistanceId?: {
    title: string;
  };
  isAnonymous: boolean;
  status: string;
  createdAt: string;
  note?: string;
}

export default function DonationsPage() {
  const { user } = useAuthStore();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDonations = async () => {
      setLoading(true);
      try {
        const res = await donationsAPI.getAll({
          limit: 10,
          page: 1,
          sort: '-createdAt',
        });

        console.log("Danh sách donation từ API:", res.data.data);

        setDonations(res.data.data || []);
      } catch (error: any) {
        console.error("Lỗi khi lấy danh sách donation:", error);
        toast.error("Không thể tải danh sách quyên góp");
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [user]);

  if (!user) return null;

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
          <CardDescription>
            Các khoản quyên góp gần đây từ cộng đồng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Đang tải...</span>
            </div>
          ) : donations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Chưa có quyên góp nào.
            </p>
          ) : (
            <div className="space-y-4">
              {donations.map((donation) => {
                const donorName = donation.isAnonymous
                  ? 'Ẩn danh'
                  : donation.userId?.fullName || 'Người dùng';

                const campaignName = donation.assistanceId?.title || 'Quyên góp chung';
                const note = donation.note;

                return (
                  <div
                    key={donation._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-success flex items-center justify-center">
                        <Gift className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{donorName}</div>
                        <div className="text-sm text-muted-foreground">
                          {campaignName}
                        </div>
                        {!donation.isAnonymous && note && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Ghi chú: {note}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-success">
                        {donation.amount.toLocaleString('vi-VN')} VNĐ
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(donation.createdAt).toLocaleString('vi-VN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ScrollToTop />
      <ChatBubble />
    </motion.div>
  );
}