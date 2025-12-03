import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  vi: {
    translation: {
      // Common
      loading: 'Đang tải...',
      save: 'Lưu',
      cancel: 'Hủy',
      delete: 'Xóa',
      edit: 'Chỉnh sửa',
      view: 'Xem',
      search: 'Tìm kiếm',
      filter: 'Lọc',
      all: 'Tất cả',
      yes: 'Có',
      no: 'Không',
      
      // Navigation
      dashboard: 'Trang chính',
      profile: 'Hồ sơ',
      appointments: 'Lịch hẹn',
      doctors: 'Bác sĩ',
      patients: 'Bệnh nhân',
      donations: 'Quyên góp',
      assistance: 'Hỗ trợ',
      charity: 'Tổ chức từ thiện',
      notifications: 'Thông báo',
      chatbot: 'Trò chuyện',
      logout: 'Đăng xuất',
      
      // Auth
      login: 'Đăng nhập',
      register: 'Đăng ký',
      email: 'Email',
      password: 'Mật khẩu',
      confirmPassword: 'Xác nhận mật khẩu',
      fullName: 'Họ và tên',
      phone: 'Số điện thoại',
      role: 'Vai trò',
      
      // Roles
      patient: 'Bệnh nhân',
      doctor: 'Bác sĩ',
      admin: 'Quản trị viên',
      
      // Dashboard
      welcome: 'Chào mừng',
      overview: 'Tổng quan',
      quickActions: 'Thao tác nhanh',
      recentActivity: 'Hoạt động gần đây',
      
      // Appointments
      bookAppointment: 'Đặt lịch khám',
      appointmentHistory: 'Lịch sử khám bệnh',
      upcoming: 'Sắp tới',
      completed: 'Đã hoàn thành',
      cancelled: 'Đã hủy',
      scheduled: 'Đã đặt lịch',
      confirmed: 'Đã xác nhận',
      inProgress: 'Đang diễn ra',
      
      // Specialties
      cardiology: 'Tim mạch',
      dermatology: 'Da liễu', 
      pediatrics: 'Nhi khoa',
      orthopedics: 'Chấn thương chỉnh hình',
      neurology: 'Thần kinh',
      generalMedicine: 'Đa khoa',
      
      // Status
      active: 'Hoạt động',
      inactive: 'Không hoạt động',
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      
      // Messages
      loginSuccess: 'Đăng nhập thành công!',
      loginError: 'Thông tin đăng nhập không chính xác',
      registerSuccess: 'Đăng ký thành công!',
      profileUpdated: 'Cập nhật hồ sơ thành công!',
      appointmentBooked: 'Đặt lịch hẹn thành công!',
      donationSuccess: 'Quyên góp thành công! Cảm ơn bạn.',
      
      // Landing Page
      heroTitle: 'Chăm sóc sức khỏe toàn diện cùng MedicalHope+',
      heroSubtitle: 'Nền tảng y tế thông minh kết nối bệnh nhân, bác sĩ và tổ chức từ thiện',
      getStarted: 'Bắt đầu',
      learnMore: 'Tìm hiểu thêm',
      
      // Features
      features: 'Tính năng nổi bật',
      onlineConsultation: 'Tư vấn trực tuyến',
      onlineConsultationDesc: 'Kết nối với bác sĩ chuyên khoa qua video call, chat an toàn',
      appointmentBooking: 'Đặt lịch khám',
      appointmentBookingDesc: 'Đặt lịch khám bệnh dễ dàng, nhận thông báo nhắc nhở',
      charitySupport: 'Hỗ trợ từ thiện',
      charitySupportDesc: 'Kết nối với các tổ chức từ thiện để được hỗ trợ chi phí điều trị',
      
      // About
      aboutTitle: 'Về MedicalHope+',
      aboutDesc: 'Chúng tôi cam kết mang đến dịch vụ chăm sóc sức khỏe chất lượng cao, dễ tiếp cận cho mọi người.',
      
      // Contact
      contact: 'Liên hệ',
      address: 'Địa chỉ',
      addressText: '123 Đường Y Tế, Quận 1, TP.HCM',
      hotline: 'Hotline',
      supportEmail: 'Email hỗ trợ',
      
      // Footer sections
      quickLinks: 'Liên kết nhanh',
      services: 'Dịch vụ',
      support: 'Hỗ trợ',
      legal: 'Pháp lý',
      aboutUs: 'Về chúng tôi',
      privacyPolicy: 'Chính sách bảo mật',
      termsOfService: 'Điều khoản dịch vụ',
      faq: 'Câu hỏi thường gặp',
      helpCenter: 'Trung tâm trợ giúp',
      
      // Dashboard specific
      totalPatients: 'Tổng bệnh nhân',
      totalDoctors: 'Tổng bác sĩ',
      totalAppointments: 'Tổng lịch hẹn',
      totalDonations: 'Tổng quyên góp',
      monthlyStats: 'Thống kê tháng',
      
      // Profile
      personalInfo: 'Thông tin cá nhân',
      medicalHistory: 'Lịch sử khám bệnh',
      changePassword: 'Đổi mật khẩu',
      currentPassword: 'Mật khẩu hiện tại',
      newPassword: 'Mật khẩu mới',
      
      // Appointments
      selectDoctor: 'Chọn bác sĩ',
      selectDate: 'Chọn ngày',
      selectTime: 'Chọn giờ',
      reason: 'Lý do khám',
      symptoms: 'Triệu chứng',
      
      // Donations  
      donateNow: 'Quyên góp ngay',
      donationAmount: 'Số tiền quyên góp',
      donationMessage: 'Lời nhắn',
      
      // Common actions
      submit: 'Gửi',
      back: 'Quay lại',
      next: 'Tiếp theo',
      confirm: 'Xác nhận',
      close: 'Đóng',
      refresh: 'Làm mới',
      
      // Additional translations
      invalidRole: 'Vai trò không hợp lệ',
      welcome_message: 'Chào mừng bạn đến với hệ thống MedicalHope+',
      invalidEmail: 'Email không hợp lệ',
      emailRequired: 'Email là bắt buộc',
      passwordRequired: 'Mật khẩu là bắt buộc',
      professionalDoctors: 'Bác sĩ chuyên nghiệp',
      professionalDoctorsDesc: 'Đội ngũ bác sĩ giàu kinh nghiệm sẵn sàng hỗ trợ và tư vấn miễn phí',
      transparentDonations: 'Quyên góp minh bạch',
      transparentDonationsDesc: 'Hệ thống quyên góp công khai, minh bạch giúp hỗ trợ những người cần giúp đỡ',
      supportCommunity: 'Cộng đồng hỗ trợ',
      supportCommunityDesc: 'Tham gia cộng đồng yêu thương, cùng nhau giúp đỡ những hoàn cảnh khó khăn',
      builtWithLove: 'Được xây dựng với tình yêu thương',
      scrollToTop: 'Cuộn lên đầu trang',
      
      // Stats
      patientsSupported: 'Bệnh nhân được hỗ trợ',
      volunteerDoctors: 'Bác sĩ tình nguyện', 
      completedAppointments: 'Cuộc hẹn đã hoàn thành',
      charityOrganizations: 'Tổ chức từ thiện',
    }
  },
  en: {
    translation: {
      // Common
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      search: 'Search',
      filter: 'Filter',
      all: 'All',
      yes: 'Yes',
      no: 'No',
      
      // Navigation
      dashboard: 'Dashboard',
      profile: 'Profile',
      appointments: 'Appointments',
      doctors: 'Doctors',
      patients: 'Patients',
      donations: 'Donations',
      assistance: 'Assistance',
      charity: 'Charity',
      notifications: 'Notifications',
      chatbot: 'Chat',
      logout: 'Logout',
      
      // Auth
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      fullName: 'Full Name',
      phone: 'Phone',
      role: 'Role',
      
      // Roles
      patient: 'Patient',
      doctor: 'Doctor',
      admin: 'Admin',
      
      // Dashboard
      welcome: 'Welcome',
      overview: 'Overview',
      quickActions: 'Quick Actions',
      recentActivity: 'Recent Activity',
      
      // Appointments
      bookAppointment: 'Book Appointment',
      appointmentHistory: 'Appointment History',
      upcoming: 'Upcoming',
      completed: 'Completed',
      cancelled: 'Cancelled',
      scheduled: 'Scheduled',
      confirmed: 'Confirmed',
      inProgress: 'In Progress',
      
      // Specialties
      cardiology: 'Cardiology',
      dermatology: 'Dermatology',
      pediatrics: 'Pediatrics',
      orthopedics: 'Orthopedics',
      neurology: 'Neurology',
      generalMedicine: 'General Medicine',
      
      // Status
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      
      // Messages
      loginSuccess: 'Login successful!',
      loginError: 'Invalid credentials',
      registerSuccess: 'Registration successful!',
      profileUpdated: 'Profile updated successfully!',
      appointmentBooked: 'Appointment booked successfully!',
      donationSuccess: 'Donation successful! Thank you.',
      
      // Landing Page
      heroTitle: 'Comprehensive Healthcare with MedicalHope+',
      heroSubtitle: 'Smart medical platform connecting patients, doctors and charities',
      getStarted: 'Get Started',
      learnMore: 'Learn More',
      
      // Features
      features: 'Key Features',
      onlineConsultation: 'Online Consultation',
      onlineConsultationDesc: 'Connect with specialist doctors via secure video calls and chat',
      appointmentBooking: 'Appointment Booking',
      appointmentBookingDesc: 'Book medical appointments easily with reminder notifications',
      charitySupport: 'Charity Support',
      charitySupportDesc: 'Connect with charities for treatment cost assistance',
      
      // About
      aboutTitle: 'About MedicalHope+',
      aboutDesc: 'We are committed to providing high-quality, accessible healthcare services for everyone.',
      
      // Contact
      contact: 'Contact',
      address: 'Address',
      addressText: '123 Medical Street, District 1, HCMC',
      hotline: 'Hotline',
      supportEmail: 'Support Email',
      
      // Footer sections
      quickLinks: 'Quick Links',
      services: 'Services',
      support: 'Support',
      legal: 'Legal',
      aboutUs: 'About Us',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      faq: 'FAQ',
      helpCenter: 'Help Center',
      
      // Dashboard specific
      totalPatients: 'Total Patients',
      totalDoctors: 'Total Doctors',
      totalAppointments: 'Total Appointments',
      totalDonations: 'Total Donations',
      monthlyStats: 'Monthly Statistics',
      
      // Profile
      personalInfo: 'Personal Information',
      medicalHistory: 'Medical History',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      
      // Appointments
      selectDoctor: 'Select Doctor',
      selectDate: 'Select Date',
      selectTime: 'Select Time',
      reason: 'Reason for Visit',
      symptoms: 'Symptoms',
      
      // Donations
      donateNow: 'Donate Now',
      donationAmount: 'Donation Amount',
      donationMessage: 'Donation Message',
      
      // Common actions
      submit: 'Submit',
      back: 'Back',
      next: 'Next',
      confirm: 'Confirm',
      close: 'Close',
      refresh: 'Refresh',
      
      // Additional translations
      invalidRole: 'Invalid role',
      welcome_message: 'Welcome to MedicalHope+ system',
      invalidEmail: 'Invalid email',
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      professionalDoctors: 'Professional Doctors',
      professionalDoctorsDesc: 'Experienced doctors ready to provide free support and consultation',
      transparentDonations: 'Transparent Donations',
      transparentDonationsDesc: 'Public and transparent donation system to help those in need',
      supportCommunity: 'Support Community',
      supportCommunityDesc: 'Join our caring community to help those in difficult circumstances',
      builtWithLove: 'Built with love',
      scrollToTop: 'Scroll to top',
      
      // Stats
      patientsSupported: 'Patients Supported',
      volunteerDoctors: 'Volunteer Doctors',
      completedAppointments: 'Completed Appointments', 
      charityOrganizations: 'Charity Organizations',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi', // default language
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;