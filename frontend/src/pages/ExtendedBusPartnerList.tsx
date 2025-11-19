/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bus, Phone, MapPin } from 'lucide-react';
import Header from '@/components/layout/NavHeader';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';
import { partnersAPI } from '@/lib/api';

interface Partner {
  _id: string;
  name: string;
  type: 'transportation' | 'food_distribution' | 'organization';
  logo?: string;
  details?: {
    location?: string;
    phone?: string;
    description?: string;
  };
}

const ExtendedBusPartnerList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'location'>('name');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const response = await partnersAPI.getAllList();
        const transportationPartners = response.data.filter((p: Partner) => p.type === 'transportation');
        setPartners(transportationPartners);
      } catch (err: any) {
        setError(err.message || 'Không thể tải danh sách nhà xe');
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  // Lọc và sắp xếp
  const filteredPartners = partners
    .filter((partner) => {
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;

      return (
        partner.name.toLowerCase().includes(q) ||
        partner.details?.location?.toLowerCase().includes(q) ||
        partner.details?.phone?.includes(q) ||
        partner.details?.description?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'location') {
        const locA = a.details?.location || '';
        const locB = b.details?.location || '';
        return locA.localeCompare(locB);
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Đang tải danh sách nhà xe...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-red-600">{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center mb-12"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3 border border-primary/20">
              <Bus className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Hợp tác vận chuyển</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Danh sách nhà xe hỗ trợ
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Các nhà xe hợp tác với <strong>MedicalHope+</strong> cung cấp vé miễn phí hoặc hỗ trợ chi phí cho bệnh nhân và người nhà.
            </p>

            {/* Bộ lọc */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Tìm nhà xe, địa điểm, số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'location')}
                className="px-4 py-2.5 rounded-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
              >
                <option value="name">Sắp xếp theo tên</option>
                <option value="location">Sắp xếp theo địa điểm</option>
              </select>
            </div>
          </motion.div>

          {/* BẢNG - DESKTOP */}
          <div className="hidden lg:block overflow-hidden rounded-2xl shadow-lg border border-primary/10 bg-card">
            <table className="w-full">
              <thead className="bg-primary/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Logo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Nhà xe</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Địa điểm</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">SĐT</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Mô tả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-muted-foreground text-lg">
                      Không tìm thấy nhà xe nào
                    </td>
                  </tr>
                ) : (
                  filteredPartners.map((partner, index) => (
                    <motion.tr
                      key={partner._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      {/* Logo */}
                      <td className="px-6 py-4">
                        <div className="h-12 w-12 rounded-full bg-white shadow-md overflow-hidden border">
                          <img
                            src={
                              partner.logo
                                ? partner.logo.startsWith('http')
                                  ? partner.logo
                                  : `${API_SERVER}${partner.logo}`
                                : '/default-logo.png'
                            }
                            alt={partner.name}
                            className="h-full w-full object-contain p-1"
                            onError={(e) => {
                              e.currentTarget.src = '/default-logo.png';
                            }}
                          />
                        </div>
                      </td>

                      {/* Tên */}
                      <td className="px-6 py-4 font-medium text-foreground">{partner.name}</td>

                      {/* Địa điểm */}
                      <td className="px-6 py-4 text-muted-foreground max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{partner.details?.location || '—'}</span>
                        </div>
                      </td>

                      {/* SĐT */}
                      <td className="px-6 py-4">
                        {partner.details?.phone ? (
                          <a
                            href={`tel:${partner.details.phone}`}
                            className="text-primary hover:underline font-medium flex items-center gap-1.5"
                          >
                            {partner.details.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Mô tả */}
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-md">
                        {partner.details?.description || '—'}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* CARD - MOBILE */}
          <div className="lg:hidden space-y-4">
            {filteredPartners.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-lg">
                Không tìm thấy nhà xe nào
              </div>
            ) : (
              filteredPartners.map((partner, index) => (
                <motion.div
                  key={partner._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-card rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-14 w-14 rounded-full bg-white shadow overflow-hidden border flex-shrink-0">
                      <img
                        src={
                          partner.logo
                            ? partner.logo.startsWith('http')
                              ? partner.logo
                              : `${API_SERVER}${partner.logo}`
                            : '/default-logo.png'
                        }
                        alt={partner.name}
                        className="h-full w-full object-contain p-1.5"
                        onError={(e) => {
                          e.currentTarget.src = '/default-logo.png';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">{partner.name}</h3>
                      {partner.details?.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {partner.details.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {partner.details?.phone && (
                      <p className="flex items-center justify-between">
                        <span className="text-muted-foreground">SĐT:</span>
                        <a
                          href={`tel:${partner.details.phone}`}
                          className="text-primary font-medium flex items-center gap-1.5"
                        >
                          <Phone className="h-4 w-4" />
                          {partner.details.phone}
                        </a>
                      </p>
                    )}
                    {partner.details?.description && (
                      <p className="text-muted-foreground text-xs line-clamp-2 mt-2 border-t pt-2">
                        {partner.details.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      <Footer />
      <ChatBubble />
      <ScrollToTop />
    </div>
  );
};

export default ExtendedBusPartnerList;