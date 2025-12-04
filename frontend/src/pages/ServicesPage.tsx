/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ServicesPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Heart, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/NavHeader';
import Footer from '@/components/layout/Footer';
import ChatBubble from './ChatbotPage';
import PackageDetailModal from './PackageDetailModal';
import PackageRegisterForm from '@/components/form/PackageRegisterForm';
import { packagesAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Package {
  _id: string;
  title: string;
  specialty: string;
  shortDescription: string;
  fullDescription: string;
  conditions: string;
  image?: string;
  isActive: boolean;
  value: string; // dùng để truyền vào form
}

const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

export default function ServicesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State riêng cho từng gói (vì mỗi card có modal + form riêng)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await packagesAPI.getAll();
        const activePackages = (res.data || [])
          .filter((pkg: any) => pkg.isActive !== false)
          .map((pkg: any) => ({
            ...pkg,
            image: pkg.image ? `${API_SERVER}${pkg.image}` : '/images/packages/default.jpg',
          }));
        setPackages(activePackages);
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Không tải được danh sách gói khám';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const openDetail = (pkg: Package) => {
    setSelectedPackage(pkg);
    setDetailOpen(true);
  };

  const openRegisterForm = (pkg: Package) => {
    setSelectedPackage(pkg);
    setFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />

      <div className="container mx-auto px-4 py-12">
        {/* Tiêu đề trang */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-12 text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-6 py-2 text-blue-700">
            <Heart className="h-5 w-5" />
            <span className="text-sm font-medium">Hỗ trợ y tế miễn phí</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Tất Cả Gói Khám Chữa Bệnh Miễn Phí
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Từ bệnh thường gặp đến bệnh hiểm nghèo – chúng tôi hỗ trợ toàn diện cho người nghèo.
          </p>
        </motion.div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground">Đang tải danh sách gói khám...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-20">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg text-red-600">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && packages.length === 0 && (
          <div className="text-center py-20">
            <Sparkles className="h-16 w-16 text-orange-400 mx-auto mb-4 opacity-50" />
            <p className="text-xl text-muted-foreground">Hiện chưa có gói khám nào được công bố.</p>
            <p className="text-sm text-muted-foreground mt-2">Hãy quay lại sau nhé!</p>
          </div>
        )}

        {/* Danh sách gói khám từ DB */}
        {!loading && packages.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <Card
                  className="healthcare-card h-full overflow-hidden rounded-2xl border-2 border-transparent 
                             cursor-pointer transition-all duration-300
                             hover:shadow-2xl hover:border-primary"
                  onClick={() => openDetail(pkg)}
                >
                  <div className="h-48 w-full overflow-hidden bg-gray-100">
                    <img
                      src={pkg.image || '/images/packages/default.jpg'}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = '/images/packages/default.jpg';
                      }}
                    />
                  </div>

                  <CardContent className="p-6 space-y-4">
                    <Badge className="text-xs font-medium" variant="secondary">
                      {pkg.specialty}
                    </Badge>

                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                      {pkg.title}
                    </h3>

                    <p className="text-sm text-gray-600 line-clamp-3">
                      {pkg.shortDescription}
                    </p>

                    <div className="text-xs italic text-orange-600">
                      <strong>Điều kiện:</strong>{' '}
                      <span className="font-medium">{pkg.conditions || 'Liên hệ để biết thêm'}</span>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        openRegisterForm(pkg);
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
                      size="lg"
                    >
                      Đăng ký ngay
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal chi tiết gói khám */}
      {selectedPackage && (
        <>
          <PackageDetailModal
            pkg={{
              title: selectedPackage.title,
              image: selectedPackage.image,
              shortDesc: selectedPackage.shortDescription,
              fullDesc: selectedPackage.fullDescription,
              conditions: selectedPackage.conditions,
              related: selectedPackage.specialty,
              value: selectedPackage.value || selectedPackage._id,
            }}
            open={detailOpen}
            onOpenChange={setDetailOpen}
            onRegister={() => {
              setDetailOpen(false);
              setFormOpen(true);
            }}
          />

          <PackageRegisterForm
            pkg={{
              title: selectedPackage.title,
              _id: selectedPackage._id,
            }}
            open={formOpen}
            onOpenChange={setFormOpen}
          />
        </>
      )}

      <Footer />
      <ChatBubble />
    </div>
  );
}