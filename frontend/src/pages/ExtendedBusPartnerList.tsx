import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bus, ExternalLink } from 'lucide-react';
import axios from 'axios';
import Header from '@/components/layout/NavHeader';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';
import { partnersAPI } from '@/lib/api';

// Giữ nguyên hàm generateOperatingHours
const generateOperatingHours = (start, end, interval) => {
  if (!start || !end || !interval) return '—';
  const hours = [];
  const startTime = new Date(`2025-10-16 ${start}`);
  const endTime = new Date(`2025-10-16 ${end}`);
  const intervalMinutes = interval * 60;

  while (startTime <= endTime) {
    hours.push(startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    startTime.setMinutes(startTime.getMinutes() + intervalMinutes);
  }
  return hours.join(', ');
};

const ExtendedBusPartnerList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const response = await partnersAPI.getAllList();
        const transportationPartners = response.data.filter(p => p.type === 'transportation');
        setPartners(transportationPartners);
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách nhà xe');
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  // Lấy danh sách thành phố từ partners
  const cities = [
    ...new Set(
      partners.flatMap((partner) => [
        partner.details?.departure,
        ...(partner.details?.destination?.split(',').map(s => s.trim()) || [])
      ].filter(Boolean))
    ),
  ];

  // Lọc và sắp xếp dữ liệu
  const filteredPartners = partners
    .filter((partner) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        partner.name?.toLowerCase().includes(q) ||
        partner.details?.title?.toLowerCase().includes(q) ||
        partner.details?.departure?.toLowerCase().includes(q) ||
        partner.details?.destination?.toLowerCase().includes(q);

      const matchesCity = !cityFilter ||
        partner.details?.departure?.includes(cityFilter) ||
        partner.details?.destination?.includes(cityFilter);

      return matchesSearch && matchesCity;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'departure')
        return (a.details?.departure || '').localeCompare(b.details?.departure || '');
      if (sortBy === 'destination')
        return (a.details?.destination || '').localeCompare(b.details?.destination || '');
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center mb-12"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3 border border-primary/20">
              <Bus className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Danh sách nhà xe chi tiết</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Nhà xe hợp tác toàn quốc
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Tìm kiếm và lọc danh sách các nhà xe hợp tác với MedicalHope+ theo tên, điểm xuất phát, điểm đến hoặc thành phố. Các nhà xe cung cấp vé miễn phí và hỗ trợ chi phí cho bệnh nhân và người nhà.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <input
                type="text"
                placeholder="Tìm kiếm nhà xe, điểm đi, điểm đến..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-md px-4 py-2 rounded-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
              />
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="px-4 py-2 rounded-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
              >
                <option value="">Tất cả thành phố</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
              >
                <option value="name">Sắp xếp theo tên</option>
                <option value="departure">Sắp xếp theo điểm xuất phát</option>
                <option value="destination">Sắp xếp theo điểm đến</option>
              </select>
            </div>
          </motion.div>

          {/* Bảng hiển thị trên màn hình lớn */}
          <div className="hidden lg:block max-w-8xl mx-auto overflow-x-auto rounded-2xl shadow-lg border border-primary/10">
            <table className="w-full bg-background">
              <thead>
                <tr className="bg-primary/10">
                  <th className="p-4 text-left text-sm font-semibold text-primary w-16">Logo</th>
                  <th className="p-4 text-left text-sm font-semibold text-primary w-46">Nhà xe</th>
                  <th className="p-4 text-left text-sm font-semibold text-primary w-32">Số điện thoại</th>
                  <th className="p-4 text-left text-sm font-semibold text-primary w-36">Điểm đi</th>
                  <th className="p-4 text-left text-sm font-semibold text-primary w-36">Điểm đến</th>
                  <th className="p-4 text-left text-sm font-semibold text-primary w-64">Lịch trình</th>
                  <th className="p-4 text-left text-sm font-semibold text-primary">Mô tả</th>
                  <th className="p-4 text-left text-sm font-semibold text-primary w-24">Website</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartners.map((partner, index) => (
                  <motion.tr
                    key={partner._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-b border-primary/10 hover:bg-orange-50/50 transition-all duration-300"
                  >
                    <td className="p-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md overflow-hidden">
                        <img
                          src={partner.logo ? (partner.logo.startsWith('http') ? partner.logo : `${API_SERVER}${partner.logo}`) : '/default-logo.png'}
                          alt={partner.name}
                          className="h-10 w-10 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/default-logo.png';
                          }}
                        />
                      </div>
                    </td>
                    <td className="p-5 text-foreground font-medium">{partner.name}</td>
                    <td className="p-5 text-muted-foreground">{partner.details?.phone || '—'}</td>
                    <td className="p-5 text-muted-foreground">{partner.details?.departure || '—'}</td>
                    <td className="p-5 text-muted-foreground">{partner.details?.destination || '—'}</td>
                    <td className="p-5 text-muted-foreground">{partner.details?.schedule || '—'}</td>
                    <td className="p-5 text-muted-foreground">{partner.details?.description || '—'}</td>
                    <td className="p-5">
                      {partner.website ? (
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 font-medium"
                        >
                          Xem
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Hiển thị dạng thẻ trên màn hình nhỏ */}
          <div className="lg:hidden space-y-4">
            {filteredPartners.map((partner, index) => (
              <motion.div
                key={partner._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-4 bg-background rounded-lg shadow-md border border-primary/10 hover:bg-orange-50/50 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={partner.logo ? (partner.logo.startsWith('http') ? partner.logo : `${API_SERVER}${partner.logo}`) : '/default-logo.png'}
                    alt={partner.name}
                    className="h-12 w-12 object-contain rounded-full shadow"
                    onError={(e) => {
                      e.currentTarget.src = '/default-logo.png';
                    }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{partner.name}</h3>
                    <p className="text-sm text-muted-foreground">{partner.details?.title || ''}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <p><span className="font-medium">Số điện thoại:</span> {partner.details?.phone || '—'}</p>
                  <p><span className="font-medium">Điểm đi:</span> {partner.details?.departure || '—'}</p>
                  <p><span className="font-medium">Điểm đến:</span> {partner.details?.destination || '—'}</p>
                  <p><span className="font-medium">Lịch trình:</span> {partner.details?.schedule || '—'}</p>
                  <p><span className="font-medium">Mô tả:</span> {partner.details?.description || '—'}</p>
                  {partner.website && (
                    <p>
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium"
                      >
                        Xem website <ExternalLink className="h-4 w-4" />
                      </a>
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
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