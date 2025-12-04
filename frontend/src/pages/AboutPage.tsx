import { motion } from 'framer-motion';
import { Heart, Users, Award, Shield, HeartHandshake, Activity, Sparkles, Eye, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import volunteerCampImg from '@/assets/volunteer-medical-camp.jpg';
import Header from '@/components/layout/NavHeader';
import Footer from '@/components/layout/Footer';
import ChatBubble from './ChatbotPage';
import { useAuthStore } from '@/stores/authStore';

export default function AboutPage() {
  const navigate = useNavigate();

  const navigateWithScroll = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(path);
  };

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const historyMilestones = [
    { year: '2015', event: 'Thành lập nền tảng MedicalHope+', description: 'Bắt đầu từ một nhóm nhỏ bác sĩ tình nguyện tại TP. Hồ Chí Minh.' },
    { year: '2018', event: 'Mở rộng toàn quốc', description: 'Hợp tác với hơn 50 tổ chức từ thiện, hỗ trợ hơn 10.000 bệnh nhân.' },
    { year: '2020', event: 'Chiến dịch chống COVID-19', description: 'Cung cấp thiết bị y tế và khám sàng lọc miễn phí cho hàng ngàn người dân.' },
    { year: '2023', event: 'Đạt mốc 50.000 bệnh nhân', description: 'Nhận giải thưởng "Tổ chức từ thiện xuất sắc" từ Bộ Y Tế.' },
    { year: '2025', event: 'Tương lai phía trước', description: 'Tiếp tục mở rộng, ứng dụng công nghệ AI để kết nối nhanh chóng hơn.' }
  ];

  const coreValues = [
    { icon: HeartHandshake, title: 'Nhân ái', description: 'Mọi hành động đều xuất phát từ trái tim, mang hy vọng và sức khỏe đến những mảnh đời bất hạnh.' },
    { icon: Shield, title: 'Uy tín', description: 'Cam kết minh bạch 100%, chuyên nghiệp trong mọi hoạt động để xây dựng niềm tin vững chắc.' },
    { icon: Activity, title: 'Hiệu quả', description: 'Tối ưu hóa mọi nguồn lực để hỗ trợ nhiều người nhất, với chất lượng y tế cao nhất có thể.' },
    { icon: Sparkles, title: 'Lan tỏa', description: 'Khơi dậy tinh thần thiện nguyện trong cộng đồng, cùng nhau tạo nên những thay đổi tích cực.' }
  ];

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />

      {/* Hero Section */}
      <section className="relative py-40 bg-gradient-to-br from-primary via-background to-secondary overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3">
              <Heart className="h-6 w-6 text-primary" />
              <span className="text-base font-semibold">Sứ mệnh từ thiện y tế</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              MedicalHope+
            </h1>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-primary">
              Nơi Kết Nối Những Trái Tim Nhân Ái
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-10 max-w-4xl mx-auto">
              Chúng tôi là nền tảng y tế từ thiện lớn nhất Việt Nam, kết nối hàng nghìn bác sĩ tình nguyện, tổ chức phi chính phủ và những bệnh nhân có hoàn cảnh khó khăn.
              Với tinh thần “Mang sức khỏe đến mọi nhà”, chúng tôi cam kết mang lại dịch vụ y tế chất lượng cao hoàn toàn miễn phí cho mọi người dân Việt Nam.
            </p>
            <Button size="lg" className="btn-charity text-lg px-12 py-7" onClick={() => navigateWithScroll('/register')}>
              Tham gia cùng chúng tôi ngay hôm nay
            </Button>
          </motion.div>
        </div>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url(${volunteerCampImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
      </section>

      {/* TẦM NHÌN (Vision) - MỚI */}
      <section className="py-24 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-7xl mx-auto text-center"
          >
            <div className="flex justify-center mb-8">
              <div className="p-5 rounded-full bg-primary/10">
                <Eye className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Tầm Nhìn Của Chúng Tôi</h2>
            <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground max-w-4xl mx-auto">
              Đến năm 2030, MedicalHope+ hướng tới trở thành nền tảng y tế từ thiện số 1 Đông Nam Á,
              nơi <strong>mọi người dân Việt Nam và khu vực, không phân biệt giàu nghèo, vùng miền hay hoàn cảnh</strong>,
              đều có thể tiếp cận dịch vụ y tế chất lượng cao hoàn toàn miễn phí chỉ bằng một cú chạm tay.
            </p>
            <p className="text-lg md:text-xl leading-relaxed text-muted-foreground mt-8 max-w-4xl mx-auto">
              Chúng tôi mơ về một tương lai mà không còn ai phải từ bỏ điều trị vì không đủ tiền,
              không còn trẻ em nào phải chịu đau đớn vì thiếu bác sĩ, và không còn cụ già nào cô đơn trong những ngày cuối đời chỉ vì không có người chăm sóc.
              Đó là Việt Nam mà chúng tôi đang ngày đêm nỗ lực xây dựng – một Việt Nam của lòng nhân ái, của sự chia sẻ và của hy vọng không bao giờ tắt.
            </p>
          </motion.div>
        </div>
      </section>

      {/* SỨ MỆNH (Mission) - MỚI */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-7xl mx-auto text-center"
          >
            <div className="flex justify-center mb-8">
              <div className="p-5 rounded-full bg-secondary/10">
                <Target className="h-12 w-12 text-secondary" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Sứ Mệnh Của Chúng Tôi</h2>
            <div className="text-lg md:text-xl leading-relaxed text-muted-foreground space-y-6 max-w-4xl mx-auto text-left md:text-center">
              <p>
                <strong className="text-primary">Kết nối</strong> hàng triệu trái tim nhân ái: bác sĩ, y tá, tình nguyện viên, nhà tài trợ với những bệnh nhân đang cần giúp đỡ nhất.
              </p>
              <p>
                <strong className="text-primary">Cung cấp</strong> dịch vụ khám chữa bệnh chất lượng cao, hoàn toàn miễn phí cho người nghèo, người già neo đơn, trẻ em mồ côi, đồng bào vùng sâu vùng xa và các đối tượng yếu thế.
              </p>
              <p>
                <strong className="text-primary">Ứng dụng công nghệ</strong> hiện đại nhất (AI, telemedicine, hồ sơ sức khỏe điện tử) để rút ngắn khoảng cách địa lý, mang bác sĩ giỏi đến tận bản làng xa xôi nhất.
              </p>
              <p>
                <strong className="text-primary">Lan tỏa tinh thần thiện nguyện</strong> trong cộng đồng, biến mỗi người dân thành một đại sứ của lòng tốt, để yêu thương không chỉ là hành động mà trở thành lối sống.
              </p>
              <p className="text-xl font-semibold text-primary mt-8">
                Chúng tôi không chỉ chữa lành cơ thể – chúng tôi chữa lành cả niềm tin vào cuộc sống.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto text-center mb-16">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-6 py-2">
              <Award className="h-5 w-5 text-secondary" />
              <span className="text-sm font-medium text-secondary">Hành trình của chúng tôi</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Lịch Sử Hình Thành</h2>
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
                className={`flex items-center mb-16 relative ${index % 2 === 0 ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-1/2 px-8 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                  <h3 className="font-bold text-3xl text-primary mb-2">{milestone.year}</h3>
                  <p className="font-semibold text-xl mb-2">{milestone.event}</p>
                  <p className="text-muted-foreground">{milestone.description}</p>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 bg-primary/10 rounded-full p-3 shadow-lg">
                  <Award className="h-6 w-6 text-primary" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto text-center mb-16">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-6 py-2">
              <Shield className="h-5 w-5 text-secondary" />
              <span className="text-sm font-medium text-secondary">Giá trị cốt lõi</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Những Giá Trị Chúng Tôi Theo Đuổi</h2>
            <p className="text-xl text-muted-foreground">
              Mỗi giá trị là kim chỉ nam, giúp chúng tôi mang đến những điều tốt đẹp nhất cho cộng đồng.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl mx-auto">
            {coreValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="text-center group"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-secondary shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <value.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="font-bold text-2xl mb-4">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      {!isAdmin && <ChatBubble />}
    </div>
  );
}