/* eslint-disable @typescript-eslint/no-explicit-any */
// components/donations/DonationsPage.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Loader2, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';
import { donationsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface Donation {
  _id: string;
  userId: {
    fullName: string;
    email: string;
  };
  amount: number;
  campaignId?: { title: string };
  assistanceId?: { title: string };
  isAnonymous: boolean;
  status: string;
  createdAt: string;
  note?: string;
}

export default function DonationsPage() {
  const { user } = useAuthStore();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!user) return;

    const fetchDonations = async () => {
      setLoading(true);
      try {
        const res = await donationsAPI.getAll({
          limit: 100, // Tăng limit để xuất đầy đủ
          page: 1,
          sort: '-createdAt',
        });
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

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Quyên góp');

    worksheet.columns = [
      { header: 'STT', key: 'index', width: 8 },
      { header: 'Người quyên góp', key: 'donor', width: 20 },
      { header: 'Chương trình', key: 'campaign', width: 30 },
      { header: 'Số tiền (VNĐ)', key: 'amount', width: 15 },
      { header: 'Ghi chú', key: 'note', width: 25 },
      { header: 'Thời gian', key: 'time', width: 20 },
      { header: 'Ẩn danh', key: 'anonymous', width: 12 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A73E8' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    donations.forEach((donation, index) => {
      const donorName = donation.isAnonymous
        ? 'Ẩn danh'
        : donation.userId?.fullName;

      const campaignName = donation.assistanceId?.title || donation.campaignId?.title || 'Quyên góp chung';

      worksheet.addRow({
        index: index + 1,
        donor: donorName,
        campaign: campaignName,
        amount: donation.amount,
        note: donation.note || '',
        time: new Date(donation.createdAt).toLocaleString('vi-VN'),
        anonymous: donation.isAnonymous ? 'Có' : 'Không',
      });
    });

    worksheet.getColumn('amount').numFmt = '#,##0';
    worksheet.getColumn('amount').alignment = { horizontal: 'right' };

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `Danh_sach_quyen_gop_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(blob, fileName);

    toast.success('Xuất file Excel thành công!');
  };

  if (!user) return null;

  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="healthcare-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="healthcare-heading">Danh sách quyên góp</CardTitle>
            <CardDescription>
              Các khoản quyên góp gần đây từ cộng đồng
            </CardDescription>
          </div>

          <Button
            onClick={exportToExcel}
            disabled={loading || donations.length === 0}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Xuất Excel
          </Button>
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
            <>
              <div className="space-y-4">
                {donations.map((donation) => {
                  const donorName = donation.isAnonymous
                    ? 'Ẩn danh'
                    : donation.userId?.fullName || 'Người dùng';

                  const campaignName = donation.assistanceId?.title || donation.campaignId?.title || 'Quyên góp chung';

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
                          {!donation.isAnonymous && donation.note && (
                            <div className="text-sm text-muted-foreground mt-1">
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

              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <p className="text-lg font-bold text-green-800">
                  Tổng cộng: {totalAmount.toLocaleString('vi-VN')} VNĐ
                  <span className="text-sm font-normal text-green-600 ml-2">
                    ({donations.length} lượt quyên góp)
                  </span>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ScrollToTop />
      {/* {!isAdmin && <ChatBubble />} */}
    </motion.div>
  );
}