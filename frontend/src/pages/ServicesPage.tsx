import { motion } from 'framer-motion';
import { Stethoscope, Ambulance, Baby, HeartPulse, Activity, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/NavHeader';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';

export default function ServicesPage() {
  const navigate = useNavigate();

  const services = [
    {
      icon: Stethoscope,
      title: 'Khám bệnh miễn phí',
      description: 'Khám sức khỏe tổng quát và chuyên khoa với đội ngũ bác sĩ giàu kinh nghiệm, tận tâm. Chúng tôi cam kết mang đến dịch vụ y tế chất lượng cao hoàn toàn miễn phí cho người có hoàn cảnh khó khăn.',
      features: ['Khám nội tổng quát', 'Khám chuyên khoa', 'Tư vấn sức khỏe', 'Theo dõi định kỳ']
    },
    {
      icon: Ambulance,
      title: 'Cấp cứu 24/7',
      description: 'Dịch vụ cấp cứu và chuyển viện khẩn cấp hoạt động 24/7, đảm bảo người bệnh được hỗ trợ kịp thời trong mọi tình huống.',
      features: ['Xe cấp cứu miễn phí', 'Đội ngũ cấp cứu chuyên nghiệp', 'Chuyển viện nhanh chóng', 'Hỗ trợ 24/7']
    },
    {
      icon: Baby,
      title: 'Chăm sóc sản nhi',
      description: 'Theo dõi thai kỳ và chăm sóc trẻ em toàn diện, từ khi mang thai đến khi trẻ khỏe mạnh phát triển.',
      features: ['Khám thai định kỳ', 'Siêu âm thai', 'Tiêm chủng đầy đủ', 'Tư vấn dinh dưỡng']
    },
    {
      icon: HeartPulse,
      title: 'Điều trị mãn tính',
      description: 'Quản lý và điều trị các bệnh lý tim mạch, tiểu đường, huyết áp. Theo dõi dài hạn và hỗ trợ thuốc điều trị.',
      features: ['Theo dõi bệnh lý', 'Cấp phát thuốc miễn phí', 'Tư vấn chế độ ăn', 'Khám định kỳ']
    },
    {
      icon: Activity,
      title: 'Xét nghiệm & Chẩn đoán',
      description: 'Xét nghiệm máu, nước tiểu, siêu âm, X-quang miễn phí với thiết bị hiện đại, kết quả nhanh chóng.',
      features: ['Xét nghiệm máu', 'Siêu âm tổng quát', 'X-quang', 'Điện tim']
    },
    {
      icon: Gift,
      title: 'Cấp phát thuốc',
      description: 'Hỗ trợ thuốc điều trị theo đơn của bác sĩ hoàn toàn miễn phí, đảm bảo chất lượng và đúng liều lượng.',
      features: ['Thuốc chính hãng', 'Tư vấn sử dụng', 'Theo dõi hiệu quả', 'Hỗ trợ dài hạn']
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-12 text-center"
        >
          <h2 className="text-4xl font-bold mb-4">Các Dịch Vụ Y Tế Từ Thiện</h2>
          <p className="text-xl text-muted-foreground">
            Chúng tôi cung cấp đầy đủ các dịch vụ y tế chuyên nghiệp, hoàn toàn miễn phí cho người có hoàn cảnh khó khăn
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="healthcare-card h-full">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-center text-xl">{service.title}</CardTitle>
                  <CardDescription className="text-center">{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <Button size="lg" className="btn-healthcare" onClick={() => navigate('/register')}>
            Đăng ký nhận dịch vụ miễn phí
          </Button>
        </motion.div>
      </div>
      <Footer />
      <ScrollToTop />
      <ChatBubble />
    </div>
  );
}