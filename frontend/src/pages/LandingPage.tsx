/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import {
  ArrowRight, Heart, Users, Stethoscope, Calendar,
  Home, Building2, HandHeart, Shield, Award, CheckCircle2,
  HeartHandshake, UserPlus, Activity, Sparkles,
  ExternalLink, Bus, Soup, DollarSign,
  Send, ChevronLeft, ChevronRight,
  Clock,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import volunteerCampImg from '@/assets/volunteer-medical-camp.jpg';
import childrenHealthImg from '@/assets/Khammatvatangkinh.jpg';
import unthuImg from '@/assets/unthu.jpg';
import Header from '@/components/layout/NavHeader';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';
import { useState, useEffect } from 'react';
import DonationForm from '@/components/form/DonationForm';
import TestimonialForm from '@/components/form/TestimonialForm';
import { partnersAPI, testimonialsAPI, assistanceAPI, doctorsAPI, clinicsAPI, eventsAPI, packagesAPI } from '@/lib/api'; // Thêm packagesAPI
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { HeartAnimation } from '@/components/layout/HeartAnimation';
import PackageDetailModal from './PackageDetailModal';
import PackageRegisterForm from '@/components/form/PackageRegisterForm';
import BusPartnerModal from './BusPartnerModal';
import FoodPointModal from './FoodPointModal';

interface Partner {
  _id: string;
  name: string;
  type: string;
  category: string;
  website?: string;
  logo?: string;
  details?: {
    title?: string;
    phone?: string;
    description?: string;
    location?: string;
    schedule?: string;
    organizer?: string;
  };
  isActive: boolean;
}
interface Testimonial {
  _id?: string;
  name: string;
  age: string;
  location: string;
  content: string;
  treatment: string;
  visible?: boolean;
  likes?: number;
}
interface AssistanceRequest {
  _id: string;
  patientId: {
    userId: {
      fullName: string;
      phone: string;
      profile: {
        dateOfBirth: string;
        address: string;
      };
    };
  };
  title: string;
  description: string;
  medicalCondition: string;
  requestedAmount: number;
  raisedAmount: number;
  urgency: string;
  status: string;
}
interface Doctor {
  _id: string;
  fullName: string;
  specialty: string;
  hospital: string;
  experience: number;
  avatar?: string;
  availableDays?: string[];
  rating?: number;
}
interface Clinic {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  services: string[];
  schedule: string;
  image?: string;
}
export default function LandingPage() {
  const navigate = useNavigate();
  const [openForm, setOpenForm] = useState(false);
  const [busPartners, setBusPartners] = useState<Partner[]>([]);
  const [foodDistributionPoints, setFoodDistributionPoints] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
  const [partnersFromDB, setPartnersFromDB] = useState<Partner[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialLoading, setTestimonialLoading] = useState(true);
  const [testimonialError, setTestimonialError] = useState<string | null>(null);
  const [selectedAssistanceId, setSelectedAssistanceId] = useState<string | null>(null);
  // 1. State mới – chỉ còn 2 trường
  const [testimonialFormData, setTestimonialFormData] = useState({
    treatment: '',
    content: '',
  });
  const [openTestimonialForm, setOpenTestimonialForm] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedTestimonials, setLikedTestimonials] = useState<string[]>([]);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  // Thêm state cho assistance requests
  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
  const [assistanceLoading, setAssistanceLoading] = useState(true);
  const [assistanceError, setAssistanceError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [clinicLoading, setClinicLoading] = useState(true);
  const [ongoingEvents, setOngoingEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [packages, setPackages] = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [selectedBusPartner, setSelectedBusPartner] = useState<Partner | null>(null);
  const [busModalOpen, setBusModalOpen] = useState(false);
  const [selectedFoodPoint, setSelectedFoodPoint] = useState<Partner | null>(null);
  const [foodModalOpen, setFoodModalOpen] = useState(false);

  // Lấy danh sách đánh giá từ API
  const fetchTestimonials = async () => {
    try {
      setTestimonialLoading(true);
      setTestimonialError(null);
      const res = await testimonialsAPI.getAll();
      setTestimonials(res.data);
      setTestimonialLoading(false);
    } catch (err: any) {
      setTestimonialError(err?.response?.data?.message || 'Lỗi khi tải danh sách đánh giá');
      setTestimonialLoading(false);
    }
  };
  // Lấy danh sách yêu cầu hỗ trợ từ API
  const fetchAssistanceRequests = async () => {
    try {
      setAssistanceLoading(true);
      setAssistanceError(null);
      // Remove limit parameter to get all records
      const response = await assistanceAPI.getPublic();
      if (response.data && Array.isArray(response.data.data)) {
        setAssistanceRequests(response.data.data);
      } else {
        setAssistanceRequests([]);
      }
      setAssistanceLoading(false);
    } catch (err: any) {
      setAssistanceError(err?.response?.data?.message || 'Lỗi khi tải danh sách yêu cầu hỗ trợ');
      setAssistanceLoading(false);
      setAssistanceRequests([]);
    }
  };
  // 2. Xử lý thay đổi input
  const handleTestimonialInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setTestimonialFormData({
      ...testimonialFormData,
      [e.target.name]: e.target.value,
    });
    // Xóa lỗi khi người dùng bắt đầu nhập lại
    setTestimonialError(null);
  };

  // 3. Reset form
  const handleTestimonialFormReset = () => {
    setTestimonialFormData({ treatment: '', content: '' });
    setTestimonialError(null);
  };

  // 4. Submit form ẩn danh
  const handleTestimonialFormSubmit = async () => {
    // Chỉ kiểm tra 2 trường cần thiết
    if (!testimonialFormData.treatment.trim() || !testimonialFormData.content.trim()) {
      setTestimonialError('Vui lòng nhập chương trình hỗ trợ và câu chuyện của bạn');
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      // Gửi kèm các trường ẩn danh (backend vẫn nhận đủ field nếu cần)
      await testimonialsAPI.create({
        name: 'Ẩn danh',           // ẩn danh hoàn toàn
        age: '',                  // hoặc để trống nếu backend cho phép
        location: 'Việt Nam',      // mặc định
        treatment: testimonialFormData.treatment,
        content: testimonialFormData.content,
        visible: true,             // hiển thị ngay (hoặc false nếu cần duyệt)
      });

      toast.success('Gửi lời cảm ơn thành công! Cảm ơn bạn đã chia sẻ ❤️');

      // Reset form
      handleTestimonialFormReset();
      setOpenTestimonialForm(false);

      // Reload danh sách đánh giá
      fetchTestimonials();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';
      setTestimonialError(msg);
      toast.error(msg);
    }
  };
  useEffect(() => {
    const liked = Object.keys(localStorage)
      .filter((key) => key.startsWith("liked_"))
      .map((key) => key.replace("liked_", ""));
    setLikedTestimonials(liked);
  }, []);
  const formatLikeCount = (num?: number) => {
    if (!num) return 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return num;
  };
  // Format số tiền sang VNĐ
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  // Fetch Partners
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        setError(null);
        // DÙNG getAllList ĐỂ LẤY TOÀN BỘ
        const res = await partnersAPI.getAllList();
        const partners: Partner[] = res.data || [];
        const normalizeLogo = (p: Partner) => ({
          ...p,
          logo: p.logo ? `${API_SERVER}${p.logo}` : undefined,
        });
        setBusPartners(
          partners
            .filter((p) => p.type === 'transportation' && p.isActive)
            .map(normalizeLogo)
        );
        setFoodDistributionPoints(
          partners
            .filter((p) => p.type === 'food_distribution' && p.isActive)
            .map(normalizeLogo)
        );
        setPartnersFromDB(
          partners
            .filter((p) => p.type === 'organization' && p.isActive)
            .map(normalizeLogo)
        );
        setLoading(false);
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'Lỗi khi tải đối tác');
        setLoading(false);
      }
    };
    fetchPartners();
    fetchTestimonials();
    fetchAssistanceRequests();
  }, []);
  // Fetch Doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setDoctorLoading(true);
        const res = await doctorsAPI.getAll();
        setDoctors(res.data.slice(0, 6));
      } catch (err) {
        console.error('Lỗi tải bác sĩ:', err);
      } finally {
        setDoctorLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch Ongoing Events thực từ DB
  useEffect(() => {
    const fetchOngoingEvents = async () => {
      try {
        setEventsLoading(true);
        const res = await eventsAPI.getAll();
        const allEvents = res.data || [];

        // Lọc sự kiện đang diễn ra hoặc sắp diễn ra (trong 30 ngày tới)
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        const activeEvents = allEvents
          .filter((event: any) => {
            const startDate = new Date(event.startDate);
            const endDate = event.endDate ? new Date(event.endDate) : startDate;
            return startDate <= thirtyDaysFromNow && endDate >= now && event.isActive !== false;
          })
          .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .slice(0, 6);

        setOngoingEvents(activeEvents);
      } catch (err) {
        console.error('Lỗi tải sự kiện:', err);
        toast.error('Không tải được sự kiện đang diễn ra');
      } finally {
        setEventsLoading(false);
      }
    };
    fetchOngoingEvents();
  }, []);
  // Fetch Packages thực từ DB
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setPackagesLoading(true);
        const res = await packagesAPI.getAll();
        const activePackages = (res.data || [])
          .filter((pkg: any) => pkg.isActive !== false)
          .slice(0, 6); // lấy 6 gói nổi bật
        setPackages(activePackages);
      } catch (err) {
        console.error('Lỗi tải gói khám:', err);
        toast.error('Không tải được gói khám');
      } finally {
        setPackagesLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleLike = async (id: string) => {
    if (localStorage.getItem(`liked_${id}`)) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_REACT_API_URL_BACKEND}/api/testimonials/${id}/like`,
        { method: "PUT" }
      );
      if (res.ok) {
        localStorage.setItem(`liked_${id}`, "true");
        setLikedTestimonials((prev) => [...prev, id]);
        setTestimonials((prev) =>
          prev.map((t) =>
            t._id === id ? { ...t, likes: (t.likes || 0) + 1 } : t
          )
        );
      }
    } catch (error) {
      console.error("Lỗi khi thả tim:", error);
    }
  };
  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  // Add OngoingEventCard component
  const OngoingEventCard: React.FC<{ event: any; index: number }> = ({ event, index }) => {
    const navigate = useNavigate();

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : startDate;
    const isOngoing = startDate <= new Date() && endDate >= new Date();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="group"
      >
        <Card
          className="h-full overflow-hidden border-2 transition-all duration-300 cursor-pointer
                   group-hover:shadow-2xl
                   group-hover:border-blue-500 
                   group-hover:bg-blue-50/70
                   healthcare-card rounded-2xl"
          onClick={() => navigate(`/events/${event._id}`)}
        >
          {/* Ảnh + Badge */}
          <div className="relative h-48">
            <img
              src={event.image ? `${API_SERVER}${event.image}` : childrenHealthImg}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { e.currentTarget.src = childrenHealthImg; }}
            />

            <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
              <Calendar className="h-3.5 w-3.5" />
              <span className="tracking-wider">
                {formatDate(event.startDate)}
                {event.endDate && (
                  <>
                    <span className="mx-1">→</span>
                    {formatDate(event.endDate)}
                  </>
                )}
              </span>
            </div>

            {/* Badge trạng thái – ĐỀU XANH DƯƠNG, KHÔNG NHÁY */}
            <div className="absolute top-3 left-3">
              {isOngoing ? (
                <div className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                  <span>ĐANG DIỄN RA</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                  <Clock className="h-3.5 w-3.5" />
                  <span>SẮP DIỄN RA</span>
                </div>
              )}
            </div>
          </div>

          <CardContent className="p-5 space-y-4">
            <h3 className="font-bold text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
              {event.title}
            </h3>

            <div className="space-y-2.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span>{event.participants || 0} / {event.target} người tham gia</span>
              </div>
              <div className="flex items-center gap-2">
                <HandHeart className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span>{event.organizer}</span>
              </div>
            </div>

            {/* Thanh tiến độ */}
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Tiến độ tham gia</span>
                <span className="font-medium text-blue-600">
                  {event.target > 0
                    ? Math.round(((event.participants || 0) / event.target) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(((event.participants || 0) / event.target) * 100, 100)}%`
                  }}
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-500 font-medium"
            >
              Xem chi tiết
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const [detailOpen, setDetailOpenState] = useState(false);
  const [formOpen, setFormOpen] = useState<boolean>(openForm);

  useEffect(() => {
    if (formOpen !== openForm) setOpenForm(formOpen);
  }, [formOpen]);

  useEffect(() => {
    if (openForm !== formOpen) setFormOpen(openForm);
  }, [openForm]);

  function setDetailOpen(open: boolean): void {
    setDetailOpenState(open);

    if (!open) {
      setFormOpen(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero pt-32 pb-20 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 opacity-25">
          <div className="absolute inset-0" style={{
            backgroundImage: `url(${volunteerCampImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />
        </div>
        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-5xl text-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 backdrop-blur-sm border border-white/20"
            >
              <Shield className="h-5 w-5 text-green-300" />
              <span className="text-sm font-medium">Bạn khỏe chúng tôi vui</span>
            </motion.div>
            <h1 className="mb-8 text-6xl font-bold leading-tight tracking-tight md:text-7xl lg:text-7xl">
              Chăm sóc sức khỏe
              <span className="block bg-gradient-to-r from-white via-yellow-200 to-orange-200 bg-clip-text text-transparent mt-2">
                Miễn phí cho mọi người
              </span>
            </h1>
            <p className="mb-10 text-xl text-white/90 md:text-2xl leading-relaxed max-w-4xl mx-auto">
              MedicalHope+ kết nối những trái tim nhân ái, mang dịch vụ y tế chất lượng cao đến với những người cần giúp đỡ nhất, không phân biệt hoàn cảnh.
            </p>
            <div className="flex flex-col gap-6 sm:flex-row sm:justify-center items-center mb-10">
              <Button
                size="lg"
                className="btn-charity text-lg px-10 py-6 h-auto rounded-full shadow-2xl hover:shadow-secondary/40 transition-all duration-300"
                onClick={() => navigate('/register')}
              >
                Tham gia ngay - Miễn phí
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
              <Button
                size="lg"
                className="text-lg px-10 py-6 h-auto rounded-full text-white shadow-2xl hover:bg-white/30 hover:border-white"
                onClick={() => navigate('/services')}
              >
                Khám phá dịch vụ
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 mt-16">
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                <CheckCircle2 className="h-5 w-5 text-green-300" />
                <span className="text-sm">100% Miễn phí</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                <Shield className="h-5 w-5 text-blue-300" />
                <span className="text-sm">Bác sĩ chuyên môn cao</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                <Award className="h-5 w-5 text-yellow-300" />
                <span className="text-sm">Được cộng đồng tin cậy</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                <HeartHandshake className="h-5 w-5 text-red-300" />
                <span className="text-sm">Tận tâm vì cộng đồng</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      {/* === HOẠT ĐỘNG ĐANG DIỄN RA (MỚI) === */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-6 py-2">
              <Sparkles className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-bold text-orange-600">ĐANG DIỄN RA</span>
            </div>
            <h2 className="healthcare-heading text-4xl font-bold mb-4">
              Hoạt Động Thiện Nguyện Đang Diễn Ra
            </h2>
            <p className="text-xl text-muted-foreground">
              Cùng theo dõi và tham gia ngay các chương trình đang được triển khai trên toàn quốc.
            </p>
          </motion.div>
          {/* Danh sách sự kiện đang diễn ra */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {ongoingEvents.map((event, index) => (
              <OngoingEventCard key={event.id} event={event} index={index} />
            ))}
          </div>
          {/* Nếu không có sự kiện nào */}
          {ongoingEvents.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                <Calendar className="h-12 w-12 text-orange-400" />
              </div>
              <p className="text-lg text-muted-foreground">
                Hiện chưa có hoạt động nào đang diễn ra. Hãy quay lại sau!
              </p>
            </div>
          )}
          <div className="mt-12 text-center">
            <Button size="lg" onClick={() => navigate('/programs')}>
              Xem tất cả chương trình <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* === GÓI KHÁM MIỄN PHÍ === */}
      <section className="py-20 bg-background relative">
        <div className="container mx-auto px-4">
          {/* Tiêu đề section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-6 py-2 text-blue-700">
              <Heart className="h-5 w-5" />
              <span className="text-sm font-medium">Hỗ trợ y tế miễn phí</span>
            </div>
            <h2 className="healthcare-heading text-4xl font-bold mb-4">
              Chúng tôi ở đây để giúp bạn
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Nếu bạn đang gặp khó khăn về sức khỏe và chi phí, hãy để lại thông tin.
              Chúng tôi sẽ xem xét và hỗ trợ bạn trong khả năng tốt nhất.
            </p>
          </motion.div>
          {/* Grid 3 gói tiêu biểu */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
            {packages.map((pkg, i) => (
              <motion.div
                key={pkg.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <Card
                  className="healthcare-card h-full group-hover:shadow-2xl group-hover:border-primary transition-all duration-300 border-2"
                  onClick={() => setDetailOpen(true)}
                >
                  <div className="h-48 w-full overflow-hidden rounded-t-lg">
                    <img
                      src={pkg.image ? `${API_SERVER}${pkg.image}` : unthuImg}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 "
                      onError={(e) => {
                        e.currentTarget.src = unthuImg;
                      }}
                    />
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="inline-flex items-center gap-1 text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                      <span>{pkg.specialty}</span>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">
                      {pkg.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{pkg.shortDescription}</p>
                    <p className="text-xs italic text-orange-600">
                      <strong>Điều kiện:</strong> {pkg.conditions}
                    </p>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormOpen(true);
                      }}
                      className="mt-4"
                    >
                      <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
                        size="lg"
                      >
                        Đăng ký ngay
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <PackageDetailModal
                  pkg={pkg}
                  open={detailOpen}
                  onOpenChange={setDetailOpen}
                  onRegister={() => {
                    setDetailOpen(false);
                    setFormOpen(true);
                  }}
                />

                <PackageRegisterForm
                  pkg={pkg}
                  open={formOpen}
                  onOpenChange={setFormOpen}
                />
              </motion.div>
            ))}
          </div>
          {/* Nút xem tất cả */}
          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/services')}
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-full px-8"
            >
              Xem tất cả gói hỗ trợ
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
      {/* Support Requests Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Kêu gọi hỗ trợ</span>
            </div>
            <h2 className="healthcare-heading text-4xl font-bold mb-4">
              Yêu Cầu Hỗ Trợ Cần Ủng Hộ
            </h2>
            <p className="text-xl text-muted-foreground">
              Cùng chung tay giúp đỡ những bệnh nhân cần hỗ trợ tài chính để vượt qua khó khăn.
            </p>
          </motion.div>
          {assistanceLoading ? (
            <div className="text-center text-muted-foreground">Đang tải yêu cầu hỗ trợ...</div>
          ) : assistanceError ? (
            <div className="text-center text-red-500">{assistanceError}</div>
          ) : assistanceRequests.length === 0 ? (
            <div className="text-center text-muted-foreground">Hiện chưa có yêu cầu hỗ trợ nào.</div>
          ) : (
            <div className="max-w-7xl mx-auto px-2">
              <div className="relative max-w-6xl mx-auto">
                {currentIndex > 0 && (
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.max(prev - 3, 0))}
                    className="absolute -left-12 top-1/2 transform -translate-y-1/2 bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-full shadow-md transition z-10"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {assistanceRequests
                    .slice(currentIndex, currentIndex + 3)
                    .map((request, index) => (
                      <motion.div
                        key={request._id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="group"
                      >
                        <div
                          className="cursor-pointer"
                          onClick={() => navigate(`/assistance/${request._id}`)}
                        >
                          <Card className="healthcare-card h-full group-hover:shadow-2xl group-hover:border-primary transition-all duration-300 border-2">
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h3 className="font-bold text-lg text-primary">
                                    Ẩn danh
                                  </h3>
                                </div>
                                <Badge
                                  variant={
                                    request.urgency === 'critical' ? 'destructive' :
                                      request.urgency === 'high' ? 'default' :
                                        request.urgency === 'medium' ? 'secondary' : 'outline'
                                  }
                                >
                                  {request.urgency === 'critical' ? 'Khẩn cấp' :
                                    request.urgency === 'high' ? 'Cao' :
                                      request.urgency === 'medium' ? 'Trung bình' : 'Thấp'}
                                </Badge>
                              </div>
                              <p className="text-sm text-primary font-semibold mb-2 line-clamp-2">
                                {request.medicalCondition}
                              </p>
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {request.description}
                              </p>
                              <div className="mb-4">
                                <div className="flex justify-between text-sm mb-2">
                                  <span>Số tiền cần:</span>
                                  <span className="font-semibold">{formatVND(request.requestedAmount)}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-gradient-to-r from-primary to-secondary h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min((request.raisedAmount / request.requestedAmount) * 100, 100)}%` }}
                                  />
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Đã quyên góp: {((request.raisedAmount / request.requestedAmount) * 100).toFixed(0)}%
                                </p>
                              </div>
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="mt-4"
                              >
                                <Button
                                  className="bg-red-500 text-white hover:bg-red-600 w-full"
                                  onClick={() => setSelectedAssistanceId(request._id)}
                                >
                                  Ủng hộ ngay
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </motion.div>
                    ))}
                </div>
                {currentIndex + 3 < assistanceRequests.length && (
                  <button
                    onClick={() =>
                      setCurrentIndex((prev) =>
                        Math.min(prev + 3, assistanceRequests.length - 3)
                      )
                    }
                    className="absolute -right-12 top-1/2 transform -translate-y-1/2 bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-full shadow-md transition z-10"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
              </div>
            </div>
          )}
          <motion.div className="mt-12 text-center">
            <Button size="lg" onClick={() => navigate('/support-requests')}>
              Xem thêm yêu cầu hỗ trợ
            </Button>
          </motion.div>
        </div>
      </section>
      {/* ==================== NHÀ XE 0 ĐỒNG – CÓ MODAL CHI TIẾT ==================== */}
      <section className="py-20 bg-gradient-to-b from-orange-50 to-background">
        <div className="container mx-auto px-4">
          {/* Tiêu đề giữ nguyên */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="inline-flex items-center gap-3 rounded-full bg-orange-100 px-6 py-3 mb-6">
              <Bus className="h-6 w-6 text-orange-600" />
              <span className="font-bold text-orange-600 text-lg">ĐỘI XE THIỆN NGUYỆN 0 ĐỒNG</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Đưa Bệnh Nhân Nghèo Về Với Gia Đình
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Hàng trăm chuyến xe miễn phí mỗi năm – không để ai phải nằm lại bệnh viện vì không có tiền về quê.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {busPartners.slice(0, 6).map((partner, i) => {
              const img = partner.logo
                ? (partner.logo.startsWith('http') ? partner.logo : `${API_SERVER}${partner.logo}`)
                : "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=500&fit=crop";

              return (
                <motion.div
                  key={partner._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => {
                    setSelectedBusPartner(partner);
                    setBusModalOpen(true);
                  }}
                >
                  <Card className="overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border-0 hover:ring-4 hover:ring-orange-200">
                    <div className="h-56 relative overflow-hidden">
                      <img
                        src={img}
                        alt={partner.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => e.currentTarget.src = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=500&fit=crop"}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge className="absolute bottom-4 left-4 bg-orange-600 text-white shadow-lg">
                        Miễn phí 100%
                      </Badge>
                    </div>

                    <CardContent className="p-6 bg-white">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                        {partner.name}
                      </h3>

                      {partner.details?.description && (
                        <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">
                          {partner.details.description}
                        </p>
                      )}

                      <div className="space-y-3 text-sm">
                        {partner.details?.location && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <MapPin className="h-4 w-4 text-orange-500" />
                            <span>{partner.details.location}</span>
                          </div>
                        )}
                        {partner.details?.phone && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{partner.details.phone}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Nút xem tất cả */}
          <div className="text-center mt-16">
            <Button size="lg" className="rounded-full px-10" onClick={() => navigate('/transport')}>
              Xem tất cả nhà xe
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </div>

          {/* Modal chi tiết nhà xe */}
          <BusPartnerModal
            partner={selectedBusPartner}
            open={busModalOpen}
            onOpenChange={setBusModalOpen}
          />
        </div>
      </section>

      {/* ==================== ĐIỂM PHÁT ĐỒ ĂN – ẢNH TRÊN, NỘI DUNG DƯỚI ==================== */}
      <section className="py-20 bg-gradient-to-b from-green-50 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-3 rounded-full bg-green-100 px-6 py-3 mb-6">
              <Soup className="h-6 w-6 text-green-600" />
              <span className="font-bold text-green-600 text-lg">PHÁT ĐỒ ĂN MIỄN PHÍ</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Bữa Ăn Ấm Áp Cho Bệnh Nhân & Người Nhà
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Hàng ngày, hàng nghìn suất cơm, cháo được trao tận tay tại cổng các bệnh viện lớn.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {foodDistributionPoints.slice(0, 6).map((point, i) => {
              const img = point.logo
                ? (point.logo.startsWith('http') ? point.logo : `${API_SERVER}${point.logo}`)
                : "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&h=500&fit=crop";

              return (
                <motion.div
                  key={point._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => {
                    setSelectedFoodPoint(point);
                    setFoodModalOpen(true);
                  }}
                >
                  <Card className="overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border-0">
                    <div className="h-56 relative overflow-hidden">
                      <img
                        src={img}
                        alt={point.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => e.currentTarget.src = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&h=500&fit=crop"}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge className="absolute bottom-4 left-4 bg-green-600 text-white shadow-lg">
                        Hàng ngày
                      </Badge>
                    </div>

                    <CardContent className="p-6 bg-white">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {point.details?.location || point.name}
                      </h3>

                      <div className="space-y-3 text-sm">
                        {point.details?.schedule && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Clock className="h-4 w-4 text-green-600" />
                            <span>{point.details.schedule}</span>
                          </div>
                        )}
                        {point.details?.organizer && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Users className="h-4 w-4 text-purple-600" />
                            <span>{point.details.organizer}</span>
                          </div>
                        )}
                        {point.details?.description && (
                          <p
                            className="text-muted-foreground text-sm leading-relaxed mt-3 line-clamp-5"
                            title={point.details.description}
                          >
                            {point.details.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-16">
            <Button size="lg" variant="outline" className="rounded-full px-10 border-green-600 text-green-600 hover:bg-green-50" onClick={() => navigate('/food-distribution')}>
              Xem tất cả điểm phát đồ ăn
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </div>
        </div>
        <FoodPointModal
          point={selectedFoodPoint}
          open={foodModalOpen}
          onOpenChange={setFoodModalOpen}
        />
      </section>

      {/* ==================== TỔ CHỨC TỪ THIỆN – ẢNH TRÊN, NỘI DUNG DƯỚI ==================== */}
      <section className="py-20 bg-gradient-to-b from-purple-50 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-3 rounded-full bg-purple-100 px-6 py-3 mb-6">
              <Building2 className="h-6 w-6 text-purple-600" />
              <span className="font-bold text-purple-600 text-lg">ĐỒNG HÀNH UY TÍN</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Những Người Bạn Đồng Hành Của Chúng Tôi
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Các tổ chức từ thiện, quỹ thiện nguyện lớn đã tin tưởng hợp tác cùng MedicalHope+.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
            {partnersFromDB.slice(0, 10).map((partner, i) => {
              const img = partner.logo
                ? (partner.logo.startsWith('http') ? partner.logo : `${API_SERVER}${partner.logo}`)
                : "https://images.unsplash.com/photo-1559028006-448665bd7c7f?w=600&h=600&fit=crop";

              return (
                <motion.div
                  key={partner._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group"
                >
                  <div className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500">
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={img}
                        alt={partner.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => e.currentTarget.src = "https://images.unsplash.com/photo-1559028006-448665bd7c7f?w=600&h=600&fit=crop"}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>

                    <div className="p-5 text-center">
                      <h4 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-purple-600 transition-colors">
                        {partner.name.length > 30 ? `${partner.name.slice(0, 27)}...` : partner.name}
                      </h4>
                      {partner.website && (
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-600 hover:underline mt-2 inline-block"
                        >
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-16">
            <Button size="lg" className="rounded-full px-10 bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/organizations')}>
              Xem tất cả đối tác
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
      {/* Testimonials Section */}
      <section className="py-20 bg-background relative">
        <div className="container mx-auto px-4">
          <HeartAnimation />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Chia sẻ từ trái tim</span>
            </div>
            <h2 className="healthcare-heading text-4xl font-bold mb-4">
              Câu chuyện của những người thụ hưởng
            </h2>
            <p className="text-xl text-muted-foreground">
              Nghe những lời chia sẻ chân thành từ những người đã được MedicalHope+ đồng hành.
            </p>
          </motion.div>
          {testimonialLoading ? (
            <div className="text-center text-muted-foreground">Đang tải đánh giá...</div>
          ) : testimonialError ? (
            <div className="text-center text-red-500">{testimonialError}</div>
          ) : testimonials.length === 0 ? (
            <div className="text-center text-muted-foreground">Chưa có đánh giá nào.</div>
          ) : (
            <div className="max-w-7xl mx-auto px-2">
              <div className="relative max-w-6xl mx-auto">
                {currentIndex > 0 && (
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.max(prev - 3, 0))}
                    className="absolute -left-12 top-1/2 transform -translate-y-1/2 bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-full shadow-md transition"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {testimonials
                    .filter((t) => t.visible !== false)
                    .slice(currentIndex, currentIndex + 3)
                    .map((testimonial, index) => (
                      <motion.div
                        key={`${testimonial._id || index}`}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="group"
                      >
                        <div
                          className="cursor-pointer"
                          onClick={() => setSelectedTestimonial(testimonial)}
                        >
                          <Card className="healthcare-card h-full group-hover:shadow-2xl group-hover:border-primary transition-all duration-300 border-2">
                            <CardContent className="pt-6">
                              <div className="mb-4">
                                <p
                                  className="text-muted-foreground italic mb-4 line-clamp-3 group-hover:text-foreground transition-colors"
                                  title={testimonial.content}
                                >
                                  "{testimonial.content}"
                                </p>
                              </div>
                              <div className="border-t pt-4 flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-primary">
                                    Ẩn danh
                                  </p>
                                  <p className="text-sm text-primary">{testimonial.treatment}</p>
                                </div>
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center"
                                >
                                  <button
                                    onClick={() => handleLike(testimonial._id)}
                                    disabled={likedTestimonials.includes(testimonial._id)}
                                    className={`flex items-center gap-1 text-sm transition ${likedTestimonials.includes(testimonial._id)
                                      ? "text-red-500"
                                      : "text-muted-foreground hover:text-red-400"
                                      }`}
                                  >
                                    <Heart
                                      className={`h-5 w-5 transition-transform duration-200 ${likedTestimonials.includes(testimonial._id)
                                        ? "fill-red-500 scale-110"
                                        : "fill-none hover:scale-110"
                                        }`}
                                    />
                                    <span>{formatLikeCount(testimonial.likes)}</span>
                                  </button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </motion.div>
                    ))}
                </div>
                {currentIndex + 3 < testimonials.length && (
                  <button
                    onClick={() =>
                      setCurrentIndex((prev) =>
                        Math.min(prev + 3, testimonials.length - 3)
                      )
                    }
                    className="absolute -right-12 top-1/2 transform -translate-y-1/2 bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-full shadow-md transition"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
              </div>
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <Button
              size="lg"
              className="btn-healthcare"
              onClick={() => setOpenTestimonialForm(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              Gửi lời yêu thương
            </Button>
          </motion.div>
          <Dialog open={openTestimonialForm} onOpenChange={setOpenTestimonialForm}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Chia sẻ câu chuyện của bạn</DialogTitle>
                <DialogDescription>
                  Hãy chia sẻ trải nghiệm của bạn với MedicalHope+. Thông tin của bạn sẽ giúp lan tỏa tinh thần nhân ái.
                </DialogDescription>
              </DialogHeader>
              <TestimonialForm
                formData={testimonialFormData}
                error={testimonialError}
                onInputChange={handleTestimonialInputChange}
                onSubmit={handleTestimonialFormSubmit}
                onReset={handleTestimonialFormReset}
              />
            </DialogContent>
          </Dialog>
          <Dialog
            open={!!selectedTestimonial}
            onOpenChange={() => setSelectedTestimonial(null)}
          >
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedTestimonial?.name}, {selectedTestimonial?.age} tuổi
                </DialogTitle>
                <DialogDescription>
                  {selectedTestimonial?.location} | {selectedTestimonial?.treatment}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-2">
                <p className="text-muted-foreground">{selectedTestimonial?.content}</p>
                <div className="flex items-center gap-1 text-red-500 font-medium mt-2">
                  <Heart className="h-5 w-5 fill-red-500" />
                  <span>{formatLikeCount(selectedTestimonial?.likes)}</span>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>
      <Footer />
      <ChatBubble />
      <ScrollToTop />
      <DonationForm
        open={!!selectedAssistanceId}
        onOpenChange={(open) => !open && setSelectedAssistanceId(null)}
        assistanceId={selectedAssistanceId || undefined}
      />
    </div>
  );
}