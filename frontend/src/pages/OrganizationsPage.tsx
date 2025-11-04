import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/NavHeader';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';
import { partnersAPI } from '@/lib/api';
import ChatBubble from './ChatbotPage';

interface Partner {
  _id: string;
  name: string;
  type: 'hospital' | 'charity' | 'international_organization' | 'association' | 'transportation' | 'food_distribution';
  category: string;
  website?: string;
  logo?: string;
  details?: {
    description?: string;
    location?: string;
    phone?: string;
    email?: string;
    activities?: string[];
  };
  isActive: boolean;
}

export default function OrganizationsPage() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

  // Hàm rút ngắn link
  const shortenLink = (url: string, maxLength = 30) => {
    if (url.length <= maxLength) return url;
    const half = Math.floor((maxLength - 3) / 2);
    return url.slice(0, half) + "..." + url.slice(-half);
  };

  // Lấy danh sách đối tác từ API
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const response = await partnersAPI.getAllList();
        // Lọc các đối tác thuộc loại tổ chức từ thiện
        const filteredPartners = response.data.filter((partner: Partner) =>
          ['hospital', 'charity', 'international_organization', 'association'].includes(partner.type)
        );
        setPartners(filteredPartners || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải danh sách tổ chức');
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-12 text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-6 py-2">
            <Building2 className="h-5 w-5 text-secondary" />
            <span className="text-sm font-medium text-secondary">Đối tác từ thiện</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">Các Tổ Chức Từ Thiện Uy Tín</h2>
          <p className="text-xl text-muted-foreground">
            Mạng lưới các tổ chức từ thiện y tế hàng đầu Việt Nam, cùng chung tay vì sức khỏe cộng đồng
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center text-muted-foreground">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : partners.length === 0 ? (
          <div className="text-center text-muted-foreground">Chưa có tổ chức nào được thêm.</div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner, index) => {
              const logoUrl = partner.logo
                ? partner.logo.startsWith('http')
                  ? partner.logo
                  : `${API_SERVER}${partner.logo}`
                : null;

              return (
                <motion.div
                  key={partner._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card className="healthcare-card h-full">
                    <CardHeader>
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow overflow-hidden">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={partner.name}
                            className="h-12 w-12 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '/default-logo.png';
                            }}
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-secondary" />
                        )}
                      </div>
                      <CardTitle className="text-center text-lg">{partner.name}</CardTitle>
                      <CardDescription className="text-center">
                        {partner.details?.description || 'Không có mô tả'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{partner.details?.location || 'Không có thông tin'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Phone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{partner.details?.phone || 'Không có thông tin'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="break-all">{partner.details?.email || 'Không có thông tin'}</span>
                      </div>
                      {partner.website && (
                        <div className="flex items-start gap-2 text-sm">
                          <ExternalLink className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-primary hover:underline"
                            title={partner.website}
                          >
                            {shortenLink(partner.website)}
                          </a>
                        </div>
                      )}
                      {partner.details?.activities?.length && (
                        <div className="pt-3 border-t">
                          <p className="text-xs font-semibold mb-2">Hoạt động chính:</p>
                          <div className="flex flex-wrap gap-1">
                            {partner.details.activities.map((activity) => (
                              <span
                                key={activity}
                                className="text-xs bg-muted px-2 py-1 rounded-full"
                              >
                                {activity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center space-y-4"
        >
          <p className="text-muted-foreground">Bạn muốn trở thành đối tác từ thiện của chúng tôi?</p>
          <Button size="lg" className="btn-healthcare" onClick={() => navigate('/register')}>
            Đăng ký hợp tác
          </Button>
        </motion.div>
      </div>
      <Footer />
      <ScrollToTop />
      <ChatBubble />
    </div>
  );
}