import { motion } from 'framer-motion';
import { Heart, Users, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import volunteerCampImg from '@/assets/volunteerCampImg.jpg';
import charityDistImg from '@/assets/charity-distribution.jpg';
import childrenHealthImg from '@/assets/children-health-checkup.jpg';
import elderlyCarelImg from '@/assets/Khamsuckhoevungcao.png';
import pediatricCareImg from '@/assets/pediatric-care.jpg';
import communityHealthImg from '@/assets/community-health.jpg';
import Header from '@/components/layout/NavHeader';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';

export default function ProgramsPage() {
  const navigate = useNavigate();

  const programs = [
    {
      title: 'Mổ tim cho trẻ em nghèo',
      description: 'Phẫu thuật tim bẩm sinh miễn phí cho trẻ em có hoàn cảnh khó khăn. Chương trình đã cứu sống hàng trăm trẻ em với bệnh tim bẩm sinh.',
      beneficiaries: '500+ ca phẫu thuật thành công',
      location: 'Bệnh viện Tim Hà Nội & TP.HCM',
      duration: 'Hoạt động liên tục từ 2018',
      status: 'Đang hoạt động',
      image: pediatricCareImg
    },
    {
      title: 'Chăm sóc người cao tuổi',
      description: 'Khám và tặng quà cho người cao tuổi tại các vùng sâu, vùng xa. Mang yêu thương đến với những người già neo đơn.',
      beneficiaries: '10,000+ người được hỗ trợ',
      location: 'Các tỉnh miền núi phía Bắc',
      duration: 'Hàng tháng',
      status: 'Đang hoạt động',
      image: elderlyCarelImg
    },
    {
      title: 'Khám sức khỏe cộng đồng',
      description: 'Tổ chức các ngày khám bệnh miễn phí tại cộng đồng, mang y tế đến tận nhà cho người dân vùng sâu vùng xa.',
      beneficiaries: '15,000+ lượt khám/năm',
      location: 'Toàn quốc',
      duration: 'Định kỳ hàng tháng',
      status: 'Đang hoạt động',
      image: volunteerCampImg
    },
    {
      title: 'Hỗ trợ dinh dưỡng trẻ em',
      description: 'Cung cấp sữa và thực phẩm dinh dưỡng cho trẻ em suy dinh dưỡng tại các vùng khó khăn.',
      beneficiaries: '8,000+ trẻ em được hỗ trợ',
      location: 'Các tỉnh Tây Nguyên',
      duration: 'Hàng quý',
      status: 'Đang hoạt động',
      image: charityDistImg
    },
    {
      title: 'Khám mắt & Tặng kính',
      description: 'Khám mắt miễn phí và tặng kính cho học sinh nghèo, giúp các em có điều kiện học tập tốt hơn.',
      beneficiaries: '12,000+ em học sinh',
      location: 'Các tỉnh miền Trung',
      duration: 'Mỗi kỳ học',
      status: 'Đang hoạt động',
      image: childrenHealthImg
    },
    {
      title: 'Chăm sóc sức khỏe sinh sản',
      description: 'Tư vấn và khám sức khỏe sinh sản miễn phí cho phụ nữ vùng cao, nâng cao nhận thức về chăm sóc sức khỏe.',
      beneficiaries: '5,000+ phụ nữ',
      location: 'Các tỉnh vùng cao',
      duration: 'Hàng quý',
      status: 'Đang hoạt động',
      image: communityHealthImg
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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Hoạt động từ thiện</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">Các Chương Trình Đang Triển Khai</h2>
          <p className="text-xl text-muted-foreground">
            Những hoạt động từ thiện y tế thực tế đang được thực hiện trên toàn quốc
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program, index) => (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="healthcare-card h-full overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={program.image}
                    alt={program.title}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                  <Badge className="absolute top-4 right-4 bg-success text-success-foreground">
                    {program.status}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{program.title}</CardTitle>
                  <CardDescription>{program.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{program.beneficiaries}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{program.location}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{program.duration}</span>
                  </div>
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
          <Button size="lg" className="btn-charity" onClick={() => navigate('/register')}>
            Tham gia ngay
          </Button>
        </motion.div>
      </div>
      <Footer />
      <ScrollToTop />
      <ChatBubble />
    </div>
  );
}