/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ProgramsPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Calendar, MapPin, ArrowRight, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/NavHeader';
import Footer from '@/components/layout/Footer';
import ChatBubble from './ChatbotPage';
import { eventsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

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
  isActive: boolean;
}

export default function ProgramsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await eventsAPI.getAll();
        const allEvents = (res.data || []) as Event[];

        // Sắp xếp: đang diễn ra → sắp tới → đã kết thúc
        const now = new Date();
        const sortedEvents = allEvents
          .filter((e: Event) => e.isActive !== false)
          .sort((a: Event, b: Event) => {
            const aStart = new Date(a.startDate);
            const bStart = new Date(b.startDate);
            const aEnd = a.endDate ? new Date(a.endDate) : aStart;
            const bEnd = b.endDate ? new Date(b.endDate) : bStart;

            const aOngoing = aStart <= now && aEnd >= now;
            const bOngoing = bStart <= now && bEnd >= now;

            if (aOngoing && !bOngoing) return -1;
            if (!aOngoing && bOngoing) return 1;
            return aStart.getTime() - bStart.getTime();
          });

        setEvents(sortedEvents);
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Không tải được danh sách chương trình';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (event: Event) => {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : start;

    const isOngoing = start <= now && end >= now;
    const isUpcoming = start > now;
    const isEnded = end < now;

    if (isOngoing) {
      return <Badge className="bg-orange-500 text-white"><Sparkles className="h-3 w-3 mr-1" />Đang diễn ra</Badge>;
    }
    if (isUpcoming) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Sắp tới</Badge>;
    }
    if (isEnded) {
      return <Badge variant="outline"><CheckCircle2 className="h-3 w-3 mr-1" />Đã kết thúc</Badge>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-12 text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3">
            <Heart className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Hoạt động từ thiện</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Các Chương Trình Đang Triển Khai
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Cùng MedicalHope+ lan tỏa yêu thương qua những hoạt động y tế thiện nguyện ý nghĩa trên khắp Việt Nam
          </p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground">Đang tải các chương trình...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-20">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-12 w-12 text-red-500" />
            </div>
            <p className="text-lg text-red-600">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && events.length === 0 && (
          <div className="text-center py-20">
            <div className="mx-auto w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <Calendar className="h-16 w-16 text-orange-400" />
            </div>
            <p className="text-xl text-muted-foreground">Hiện chưa có chương trình nào được công bố.</p>
            <p className="text-sm text-muted-foreground mt-2">Hãy quay lại sau nhé!</p>
          </div>
        )}

        {/* Danh sách chương trình từ DB */}
        {!loading && events.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event, index) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <Card
                  className="h-full overflow-hidden border-2 transition-all duration-300 
                           hover:shadow-2xl hover:border-primary cursor-pointer"
                  onClick={() => navigate(`/events/${event._id}`)}
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={event.image ? `${API_SERVER}${event.image}` : '/images/default-event.jpg'}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = '/images/default-event.jpg';
                      }}
                    />
                    <div className="absolute top-4 right-4">
                      {getStatusBadge(event)}
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-center group-hover:text-primary transition-colors leading-tight">
                      <span
                        className="block"
                        title={event.title}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        } as React.CSSProperties}
                      >
                        {event.title}
                      </span>
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {event.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>
                        {formatDate(event.startDate)}
                        {event.endDate && ` → ${formatDate(event.endDate)}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>
                        {event.participants || 0} / {event.target || '?'} người tham gia
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Heart className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{event.organizer}</span>
                    </div>
                  </CardContent>

                  <div className="p-4 border-t bg-gray-50">
                    <Button
                      variant="outline"
                      className="w-full group-hover:bg-primary group-hover:text-white transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/events/${event._id}`);
                      }}
                    >
                      Xem chi tiết
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Nút tham gia */}
        {!loading && events.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 text-center"
          >
            <Button size="lg" className="btn-charity" onClick={() => navigate('/register')}>
              Tham gia cùng chúng tôi
              <Heart className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </div>

      <Footer />
      <ChatBubble />
    </div>
  );
}