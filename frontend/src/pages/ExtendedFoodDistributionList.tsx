import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Soup } from 'lucide-react';
import Header from '@/components/layout/NavHeader';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';
import { partnersAPI } from '@/lib/api';

interface FoodDistributionPoint {
  _id: string;
  name: string;
  type: 'food_distribution';
  logo?: string;
  details: {
    location?: string;
    schedule?: string;
    organizer?: string;
    description?: string;
  };
  isActive: boolean;
}

const ExtendedFoodDistributionList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [sortBy, setSortBy] = useState('location');
  const [foodDistributionPoints, setFoodDistributionPoints] = useState<FoodDistributionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Xử lý đường dẫn API
  const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

  // Lấy danh sách điểm phát đồ ăn từ API
  useEffect(() => {
    const fetchFoodDistributionPoints = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await partnersAPI.getAllList(); // Lấy toàn bộ, không phân trang
        const points = response.data
          .filter((partner: any) => partner.type === 'food_distribution' && partner.isActive)
          .map((p: any) => ({
            ...p,
            logo: p.logo ? `${API_SERVER}${p.logo}` : undefined,
          }));
        setFoodDistributionPoints(points);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Lỗi khi tải danh sách điểm phát đồ ăn');
      } finally {
        setLoading(false);
      }
    };

    fetchFoodDistributionPoints();
  }, []);

  // Lấy danh sách thành phố duy nhất
  const cities = [
    ...new Set(
      foodDistributionPoints
        .map((point) =>
          point.details.location?.match(/(TP\.HCM|Hà Nội|Đà Nẵng|Huế|Cần Thơ|Quảng Trị|Nghệ An)/)?.[1] || 'Khác'
        )
        .filter(Boolean)
    ),
  ];

  // Lọc và sắp xếp dữ liệu
  const filteredPoints = foodDistributionPoints
    .filter(
      (point) =>
        (point.details.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          point.details.organizer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          point.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!cityFilter || point.details.location?.includes(cityFilter))
    )
    .sort((a, b) => {
      if (sortBy === 'location') {
        return (a.details.location || '').localeCompare(b.details.location || '');
      }
      if (sortBy === 'organizer') {
        return (a.details.organizer || '').localeCompare(b.details.organizer || '');
      }
      return 0;
    });

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
              <Soup className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Danh sách điểm phát đồ ăn chi tiết</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Điểm phát đồ ăn toàn quốc
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Tìm kiếm và lọc danh sách các điểm phát đồ ăn miễn phí theo địa điểm, tổ chức hoặc thành phố. Các điểm phát đồ ăn cung cấp suất ăn miễn phí cho bệnh nhân và người nhà.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <input
                type="text"
                placeholder="Tìm kiếm điểm phát đồ ăn, tổ chức..."
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
                <option value="location">Sắp xếp theo địa điểm</option>
                <option value="organizer">Sắp xếp theo tổ chức</option>
              </select>
            </div>
          </motion.div>

          {/* Trạng thái tải / lỗi / rỗng */}
          {loading ? (
            <div className="text-center text-muted-foreground py-10">Đang tải dữ liệu...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">{error}</div>
          ) : filteredPoints.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              Không tìm thấy điểm phát đồ ăn nào phù hợp.
            </div>
          ) : (
            <>
              {/* Bảng - Desktop */}
              <div className="hidden lg:block max-w-7xl mx-auto overflow-x-auto rounded-2xl shadow-lg border border-primary/10">
                <table className="w-full bg-background">
                  <thead>
                    <tr className="bg-primary/10">
                      <th className="p-4 text-left text-sm font-semibold text-primary w-32">Logo</th>
                      <th className="p-4 text-left text-sm font-semibold text-primary w-56">Địa điểm</th>
                      <th className="p-4 text-left text-sm font-semibold text-primary w-64">Giờ phát</th>
                      <th className="p-4 text-left text-sm font-semibold text-primary w-64">Tổ chức</th>
                      <th className="p-4 text-left text-sm font-semibold text-primary">Mô tả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPoints.map((point, index) => (
                      <motion.tr
                        key={point._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-primary/10 hover:bg-orange-50/50 transition-all duration-300"
                      >
                        <td className="p-5">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md overflow-hidden">
                            {point.logo ? (
                              <img
                                src={point.logo}
                                alt={point.name}
                                className="h-full w-full object-contain p-1"
                                onError={(e) => {
                                  e.currentTarget.src = '/default-logo.png';
                                  e.currentTarget.onerror = null;
                                }}
                              />
                            ) : (
                              <Soup className="h-10 w-10 text-primary" />
                            )}
                          </div>
                        </td>
                        <td className="p-5 text-foreground font-medium">
                          {point.details.location || 'Chưa cung cấp'}
                        </td>
                        <td className="p-5 text-muted-foreground">
                          {point.details.schedule || 'Chưa cung cấp'}
                        </td>
                        <td className="p-5 text-muted-foreground">
                          {point.details.organizer || 'Chưa cung cấp'}
                        </td>
                        <td className="p-5 text-muted-foreground">
                          {point.details.description || 'Chưa cung cấp'}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Thẻ - Mobile */}
              <div className="lg:hidden space-y-4">
                {filteredPoints.map((point, index) => (
                  <motion.div
                    key={point._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-4 bg-background rounded-lg shadow-md border border-primary/10 hover:bg-orange-50/50 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md overflow-hidden">
                        {point.logo ? (
                          <img
                            src={point.logo}
                            alt={point.name}
                            className="h-full w-full object-contain p-1"
                            onError={(e) => {
                              e.currentTarget.src = '/default-logo.png';
                              e.currentTarget.onerror = null;
                            }}
                          />
                        ) : (
                          <Soup className="h-10 w-10 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {point.details.location || 'Chưa cung cấp'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {point.details.organizer || 'Chưa cung cấp'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <p>
                        <span className="font-medium">Giờ phát:</span>{' '}
                        {point.details.schedule || 'Chưa cung cấp'}
                      </p>
                      <p>
                        <span className="font-medium">Tổ chức:</span>{' '}
                        {point.details.organizer || 'Chưa cung cấp'}
                      </p>
                      <p>
                        <span className="font-medium">Mô tả:</span>{' '}
                        {point.details.description || 'Chưa cung cấp'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
      <ChatBubble />
      <ScrollToTop />
    </div>
  );
};

export default ExtendedFoodDistributionList;