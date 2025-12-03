import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

// Role-specific dashboards
import PatientDashboard from '@/components/dashboard/PatientDashboard';
import DoctorDashboard from '@/components/dashboard/DoctorDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  // ==========================
  // 🌞 Danh sách lời nhắn tích cực (7 câu cho mỗi nhóm)
  // ==========================
  const doctorMessages = [
    'Cảm ơn bạn đã dành cả trái tim để chăm sóc bệnh nhân hôm nay 💙',
    'Một nụ cười của bạn có thể làm dịu đi nỗi đau của người khác 😊',
    'Hãy tự hào vì bạn đang chữa lành thế giới từng ngày 🌍',
    'Bạn không chỉ là bác sĩ, bạn là nguồn hy vọng cho rất nhiều người 💫',
    'Chúc bạn một ngày làm việc tràn đầy năng lượng và niềm vui 🌞',
    'Mỗi ca khám là một cơ hội để lan tỏa lòng nhân ái ❤️',
    'Thế giới cần nhiều người như bạn — vừa giỏi chuyên môn, vừa đầy tình thương 🌟',
  ];

  const patientMessages = [
    'Mỗi ngày là một cơ hội mới để bạn mạnh mẽ hơn 💪',
    'Hãy tin rằng ánh sáng luôn chờ ở cuối con đường ✨',
    'Bạn đang làm rất tốt — đừng bao giờ bỏ cuộc ❤️',
    'Sức khỏe của bạn quan trọng và bạn xứng đáng được hạnh phúc 🌸',
    'Cuộc sống vẫn còn rất nhiều điều tốt đẹp đang chờ bạn 🌈',
    'Mỗi bước tiến nhỏ hôm nay là một chiến thắng lớn ngày mai 🌻',
    'Hãy mỉm cười, vì bạn đã đi được một chặng đường thật đáng nể 🌷',
  ];

  const charityMessages = [
    'Cảm ơn bạn vì đã mang yêu thương đến cho cuộc sống ❤️',
    'Thế giới tốt đẹp hơn nhờ có những người như bạn 🌍',
    'Bạn đang viết nên những câu chuyện nhân ái đầy ý nghĩa 🌸',
    'Một hành động nhỏ của bạn có thể thay đổi cuộc đời ai đó 🌱',
    'Cảm ơn vì mỗi ngày bạn đều lan tỏa lòng tốt 💖',
    'Từng nụ cười bạn mang lại là ánh sáng trong cuộc sống của ai đó 💫',
    'Sự tử tế của bạn là ngọn lửa ấm áp giữa cuộc sống này 🔥',
  ];

  const adminMessages = [
    'Chúc bạn một ngày làm việc thật hiệu quả và đầy niềm vui 💼',
    'Mỗi quyết định của bạn đang góp phần tạo nên thành công của hệ thống 💪',
    'Một ngày tuyệt vời để làm điều tuyệt vời — hãy bắt đầu nào! 🌞',
    'Chúc bạn giữ vững tinh thần lãnh đạo và sự sáng suốt hôm nay 🌟',
    'Một quản trị viên xuất sắc luôn biết cách lan tỏa năng lượng tích cực ✨',
    'Sự kiên định và tầm nhìn của bạn là nền tảng cho mọi thành công 🚀',
    'Bạn là người giữ cho mọi thứ vận hành trơn tru — cảm ơn vì điều đó 🙌',
  ];

  // ==========================
  // 🔢 Lấy lời nhắn ngẫu nhiên theo ngày trong tuần
  // ==========================
  const dailyMessage = useMemo(() => {
    if (!user) return t('haveAGreatDay');

    const dayOfWeek = new Date().getDay(); 

    const pickMessage = (arr: string[]) => arr[dayOfWeek % arr.length];

    switch (user.role) {
      case 'doctor':
        return pickMessage(doctorMessages);
      case 'patient':
        return pickMessage(patientMessages);
      case 'admin':
        return pickMessage(adminMessages);
      default:
        return t('haveAGreatDay');
    }
  }, [user, t]);

  // ==========================
  // 🧩 Render Dashboard
  // ==========================
  const renderDashboard = () => {
    switch (user.role) {
      case 'patient':
        return <PatientDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold">{t('invalidRole')}</h2>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* 🌈 Welcome Header */}
      <div className="bg-gradient-primary rounded-xl p-8 text-white shadow-md">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold mb-2">
            {t('welcome')}, {user.fullName}!
          </h1>

          {/* 💬 Lời nhắn tích cực có hiệu ứng fade-in */}
          <motion.p
            key={dailyMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mt-3 text-lg text-white/95"
          >
            {dailyMessage}
          </motion.p>
        </motion.div>
      </div>

      {/* Role-specific Dashboard */}
      {renderDashboard()}
    </motion.div>
  );
}
