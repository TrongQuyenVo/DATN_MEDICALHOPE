/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/EventDetailPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, MapPin, Users, Heart, Clock, ArrowLeft,
  Share2, Sparkles, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/NavHeader';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';
import { eventsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import EventRegisterForm from '@/components/form/EventRegisterForm';

const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

interface Event {
  _id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string;
  organizer: string;
  participants?: number;
  target?: number;
  image?: string;
  details?: string;
  isActive: boolean;
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  const fetchEvent = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await eventsAPI.getById(id);
      setEvent(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không tìm thấy chương trình này';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadge = () => {
    if (!event) return null;
    const now = new Date();
    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : start;

    if (start <= now && end >= now) {
      return (
        <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold px-5 py-2 text-sm shadow-lg">
          <Sparkles className="h-4 w-4 mr-1.5" />
          ĐANG DIỄN RA
        </Badge>
      );
    }
    if (start > now) {
      return (
        <Badge className="bg-blue-500 text-white font-medium px-5 py-2 text-sm shadow-md">
          <Clock className="h-4 w-4 mr-1.5" />
          SẮP DIỄN RA
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-blue-300 text-blue-700 font-medium px-5 py-2 text-sm">
        ĐÃ KẾT THÚC
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-xl text-blue-700 font-medium">Đang tải chương trình...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-20 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="mx-auto w-28 h-28 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Heart className="h-14 w-14 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-blue-900 mb-3">Không tìm thấy chương trình</h2>
            <p className="text-blue-700 mb-8">{error || 'Chương trình đã bị xóa hoặc không tồn tại.'}</p>
            <Button onClick={() => navigate('/programs')} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Quay lại danh sách
            </Button>
          </motion.div>
        </div>
        <Footer />
      </>
    );
  }

  const progress = event.target ? Math.min((event.participants || 0) / event.target * 100, 100) : 0;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">

        {/* HERO SECTION */}
        <div className="relative h-screen max-h-[600px] md:max-h-[700px] overflow-hidden">
          <img
            src={event.image ? `${API_SERVER}${event.image}` : '/images/default-event-large.jpg'}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = '/images/default-event-large.jpg'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />

          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
            <div className="container mx-auto max-w-7xl">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20 mb-6 border border-white/30 backdrop-blur-sm"
                onClick={() => navigate('/programs')}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Quay lại danh sách
              </Button>

              <div className="max-w-4xl">
                <div className="mb-4">{getStatusBadge()}</div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                  {event.title}
                </h1>
                <p className="text-xl text-white/90 flex items-center gap-2">
                  <Heart className="h-6 w-6 text-cyan-300" />
                  Tổ chức bởi: <span className="font-semibold">{event.organizer}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="container mx-auto px-4 py-24 -mt-20 relative z-10">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* NỘI DUNG CHÍNH */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl shadow-2xl p-8 border border-blue-100"
              >
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-blue-800">
                  <Sparkles className="h-8 w-8 text-blue-500" />
                  Giới thiệu chương trình
                </h2>
                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-5">
                  <p className="whitespace-pre-line text-lg">{event.description}</p>

                  {event.details && (
                    <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
                      <h3 className="font-bold text-xl mb-3 text-blue-800 flex items-center gap-2">
                        <ChevronRight className="h-5 w-5 text-blue-600" />
                        Thông tin chi tiết
                      </h3>
                      <p className="whitespace-pre-line text-blue-900 font-medium">{event.details}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* SIDEBAR - XANH DƯƠNG SIÊU ĐẸP */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-blue-200 sticky top-24"
              >
                <h3 className="text-2xl font-bold mb-6 text-blue-800">Thông tin sự kiện</h3>

                <div className="space-y-6 text-lg">
                  {/* Thời gian */}
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Thời gian</p>
                      <p className="text-gray-700">
                        {formatDate(event.startDate)}
                        {event.endDate && (
                          <>
                            <br />
                            <span className="text-sm text-blue-600 font-medium">→ {formatDate(event.endDate)}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Địa điểm */}
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Địa điểm</p>
                      <p className="text-gray-700 font-medium">{event.location}</p>
                    </div>
                  </div>

                  {/* Số người */}
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Số người tham gia</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {event.participants || 0} / {event.target || '∞'}
                      </p>
                      {event.target && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                            />
                          </div>
                          <p className="text-sm text-blue-600 font-medium mt-1">{Math.round(progress)}% mục tiêu</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* NÚT ĐĂNG KÝ SIÊU HẤP DẪN */}
                <div className="mt-8 pt-6 border-t border-blue-100">
                  <Button
                    size="lg"
                    className="w-full text-lg py-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300
                               bg-gradient-to-r from-blue-600 to-cyan-600 
                               hover:from-blue-700 hover:to-cyan-700 
                               text-white font-bold text-xl"
                    onClick={() => setRegisterOpen(true)}
                  >
                    <Sparkles className="mr-3 h-6 w-6" />
                    ĐĂNG KÝ THAM GIA NGAY
                    <Sparkles className="ml-3 h-6 w-6" />
                  </Button>
                </div>

                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 font-medium"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Đã sao chép link chia sẻ!');
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Chia sẻ chương trình
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* FORM ĐĂNG KÝ */}
        <EventRegisterForm
          event={event}
          open={registerOpen}
          onOpenChange={setRegisterOpen}
          onSuccess={() => {
            fetchEvent();
            toast.success('Đăng ký thành công! Cảm ơn bạn đã đồng hành ❤️');
          }}
        />
      </div>

      <Footer />
      <ScrollToTop />
      <ChatBubble />
    </>
  );
}