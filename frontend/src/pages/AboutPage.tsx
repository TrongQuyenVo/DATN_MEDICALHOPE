import { motion } from 'framer-motion';
import { Heart, Users, Award, Shield, HeartHandshake, Activity, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import teamImg from '@/assets/team-collaboration.jpg';
import historyImg from '@/assets/history-timeline.jpg';
import volunteerCampImg from '@/assets/volunteer-medical-camp.jpg';
import Header from '@/components/layout/NavHeader';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';

export default function AboutPage() {
  const navigate = useNavigate();

  const navigateWithScroll = (path) => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate(path);
      console.log(`Navigating to ${path}`);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const historyMilestones = [
    {
      year: '2015',
      event: 'Thành lập nền tảng MedicalHope+ với sứ mệnh mang y tế miễn phí đến mọi người.',
      description: 'Bắt đầu từ một nhóm nhỏ bác sĩ tình nguyện tại TP. Hồ Chí Minh.'
    },
    {
      year: '2018',
      event: 'Mở rộng toàn quốc',
      description: 'Hợp tác với hơn 50 tổ chức từ thiện, hỗ trợ hơn 10,000 bệnh nhân.'
    },
    {
      year: '2020',
      event: 'Chiến dịch chống COVID-19',
      description: 'Cung cấp thiết bị y tế và khám sàng lọc miễn phí cho hàng ngàn người dân.'
    },
    {
      year: '2023',
      event: 'Đạt mốc 50,000 bệnh nhân',
      description: 'Nhận giải thưởng "Tổ chức từ thiện xuất sắc" từ Bộ Y Tế.'
    },
    {
      year: '2025',
      event: 'Tương lai phía trước',
      description: 'Tiếp tục mở rộng, ứng dụng công nghệ AI để kết nối nhanh chóng hơn.'
    }
  ];

  const coreValues = [
    {
      icon: HeartHandshake,
      title: 'Nhân ái',
      description: 'Mọi hành động đều xuất phát từ trái tim, mang hy vọng và sức khỏe đến những mảnh đời bất hạnh.'
    },
    {
      icon: Shield,
      title: 'Uy tín',
      description: 'Cam kết minh bạch 100%, chuyên nghiệp trong mọi hoạt động để xây dựng niềm tin vững chắc.'
    },
    {
      icon: Activity,
      title: 'Hiệu quả',
      description: 'Tối ưu hóa mọi nguồn lực để hỗ trợ nhiều người nhất, với chất lượng y tế cao nhất có thể.'
    },
    {
      icon: Sparkles,
      title: 'Lan tỏa',
      description: 'Khơi dậy tinh thần thiện nguyện trong cộng đồng, cùng nhau tạo nên những thay đổi tích cực.'
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />
      {/* Hero Section */}
      <section className="relative py-40 bg-gradient-to-br from-primary via-background to-secondary">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-1">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Sứ mệnh từ thiện y tế</span>
            </div>
            <h2 className="healthcare-heading text-4xl font-bold mb-6">
              MedicalHope+
            </h2>
            <h2 className="healthcare-heading text-4xl font-bold mb-6">
              Nơi Kết Nối Những Trái Tim Nhân Ái
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              Chúng tôi là nền tảng y tế từ thiện hàng đầu Việt Nam, kết nối bác sĩ tình nguyện, tổ chức từ thiện và bệnh nhân có hoàn cảnh khó khăn. Với tinh thần "Mang sức khỏe đến mọi nhà", chúng tôi cam kết mang lại dịch vụ y tế chất lượng cao hoàn toàn miễn phí, giúp hàng ngàn người vượt qua bệnh tật và tìm lại niềm vui sống.
            </p>
            <Button
              size="lg"
              className="btn-charity"
              onClick={() => navigateWithScroll('/register')}
            >
              Tham gia cùng chúng tôi
            </Button>
          </motion.div>
        </div>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url(${volunteerCampImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
      </section>

      {/* History Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-6 py-2">
              <Award className="h-5 w-5 text-secondary" />
              <span className="text-sm font-medium text-secondary">Hành trình của chúng tôi</span>
            </div>
            <h2 className="healthcare-heading text-4xl font-bold mb-4">Lịch Sử Hình Thành</h2>
            <p className="text-xl text-muted-foreground">
              Từ một ý tưởng nhỏ đến một mạng lưới từ thiện rộng lớn, chúng tôi luôn hướng tới cộng đồng với tình yêu thương vô bờ.
            </p>
          </motion.div>
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary/20 transform -translate-x-1/2" />
            {historyMilestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`flex items-center mb-12 ${index % 2 === 0 ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-1/2 px-8 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                  <h3 className="font-bold text-2xl mb-2">{milestone.year}</h3>
                  <p className="font-semibold mb-1">{milestone.event}</p>
                  <p className="text-muted-foreground text-sm">{milestone.description}</p>
                </div>
                <div className="w-1/2" />
                <div className="absolute left-1/2 transform -translate-x-1/2 bg-primary/10 rounded-full p-2">
                  <Award className="h-4 w-4 text-primary" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-6 py-2">
              <Shield className="h-5 w-5 text-secondary" />
              <span className="text-sm font-medium text-secondary">Giá trị cốt lõi</span>
            </div>
            <h2 className="healthcare-heading text-4xl font-bold mb-4">Những Giá Trị Chúng Tôi Theo Đuổi</h2>
            <p className="text-xl text-muted-foreground">
              Mỗi giá trị là kim chỉ nam, giúp chúng tôi mang đến những điều tốt đẹp nhất cho cộng đồng.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {coreValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                  <value.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-3">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-4xl font-bold mb-6">
              Hãy Cùng Chúng Tôi Tạo Nên Sự Khác Biệt
            </h2>
            <p className="text-xl mb-8">
              Mỗi đóng góp của bạn là một hy vọng, một nụ cười, một cuộc đời được thay đổi. Hãy tham gia MedicalHope+ ngay hôm nay để lan tỏa yêu thương!
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="btn-charity text-lg px-10 py-6 h-auto rounded-full bg-white text-primary hover:bg-white/90"
                onClick={() => navigateWithScroll('/register')}
              >
                Tham gia tình nguyện
                <HeartHandshake className="ml-3 h-6 w-6" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
      <ChatBubble />
    </div>
  );
}