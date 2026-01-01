/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  Video,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  XCircle,
  PlusCircle,
  Trash2,
  Save,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/authStore";
import { useState, useEffect } from "react"; import { useQueryClient } from '@tanstack/react-query'; import toast from "react-hot-toast";
import BookAppointmentForm from "@/components/form/BookAppointmentForm";
import AppointmentDetailDialog from "@/components/appointments/AppointmentDetailDialog";
import { appointmentsAPI } from "@/lib/api";
import api from "@/lib/api";
import ChatBubble from "./ChatbotPage";

export default function AppointmentsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [openAppointmentDetail, setOpenAppointmentDetail] = useState(false);

  // === Phần lịch rảnh của bác sĩ ===
  const [slots, setSlots] = useState<any[]>([]);
  const [originalSlots, setOriginalSlots] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const isAdmin = user?.role === 'admin';
  // Load lịch hẹn
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentsAPI.getAll({ limit: 50, sort: '-scheduledTime' });
      setAppointments(response.data.appointments || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể tải lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  // Load lịch rảnh (chỉ bác sĩ)
  const loadAvailability = async () => {
    if (user?.role !== 'doctor') return;
    try {
      const res = await api.get('/doctors/profile');
      if (res.data.success && res.data.doctor?.availableSlots) {
        const valid = res.data.doctor.availableSlots
          .filter((s: any) => s.date >= today && s.isActive !== false)
          .sort((a: any, b: any) => a.date.localeCompare(b.date));

        setSlots(valid);
        setOriginalSlots(JSON.parse(JSON.stringify(valid)));
      }
    } catch {
      toast.error('Không tải được lịch rảnh');
    }
  };

  useEffect(() => {
    fetchAppointments();
    loadAvailability();
  }, [user]);

  // === XỬ LÝ LỊCH RẢNH (giữ nguyên logic cũ, đã tối ưu) ===
  const handleAddSlot = () => {
    const next = new Date();
    next.setDate(next.getDate() + 7);
    const nextDate = next.toISOString().split('T')[0];
    if (slots.some(s => s.date === nextDate)) return toast.error('Ngày này đã có rồi!');
    setSlots([...slots, { date: nextDate, times: ['09:00'], isActive: true }]);
  };

  const handleDateChange = (i: number, date: string) => {
    if (date < today) return toast.error('Không chọn ngày quá khứ');
    if (slots.some((s, idx) => idx !== i && s.date === date)) return toast.error('Ngày này đã tồn tại!');
    const updated = [...slots];
    updated[i].date = date;
    setSlots(updated);
  };

  const handleAddTime = (dateIdx: number) => {
    const updated = [...slots];
    const times = updated[dateIdx].times;
    // Find the next available hour (08:00..20:00). If all taken, show error.
    let newTime: string | null = null;
    for (let h = 8; h <= 20; h++) {
      const t = `${String(h).padStart(2, '0')}:00`;
      if (!times.includes(t)) { newTime = t; break; }
    }
    if (!newTime) return toast.error('Không thể thêm giờ nữa');
    times.push(newTime);
    times.sort();
    setSlots(updated);
  };

  const handleTimeChange = (dateIdx: number, timeIdx: number, value: string) => {
    if (!value) return;
    const updated = [...slots];
    const times = updated[dateIdx].times;
    const others = times.filter((_: any, i: number) => i !== timeIdx);
    if (others.includes(value)) return toast.error('Khung giờ này đã tồn tại!');
    times[timeIdx] = value;
    times.sort();
    setSlots(updated);
  };

  const handleDeleteTime = (dateIdx: number, timeIdx: number) => {
    if (slots[dateIdx].times.length <= 1) return toast.error('Phải có ít nhất 1 khung giờ');
    const updated = [...slots];
    updated[dateIdx].times.splice(timeIdx, 1);
    setSlots(updated);
  };

  const handleDeleteDate = (i: number) => setSlots(slots.filter((_, idx) => idx !== i));

  const handleSaveAvailability = async () => {
    let error = false;
    const dates = slots.map(s => s.date);
    if (new Set(dates).size < dates.length) { toast.error('Có ngày bị trùng!'); error = true; }
    for (const slot of slots) {
      const times = slot.times.filter((t: string) => t.trim());
      if (new Set(times).size < times.length) {
        toast.error(`Ngày ${slot.date} có khung giờ bị trùng!`);
        error = true;
      }
    }
    if (error) return;

    let cleaned = slots
      .map(s => ({ date: s.date, times: [...new Set(s.times)].sort(), isActive: true }))
      .filter(s => s.times.length > 0);

    // Loại bỏ các ngày đã quá hạn trước khi lưu
    cleaned = cleaned.filter(s => s.date >= today);

    if (cleaned.length === 0) return toast.error('Phải có ít nhất 1 ngày!');

    try {
      await api.put('/doctors/availability', { availableSlots: cleaned });
      toast.success('Cập nhật lịch rảnh thành công!');
      setOriginalSlots(JSON.parse(JSON.stringify(cleaned)));
      setSlots(cleaned);
      setIsEditing(false);
    } catch {
      toast.error('Lỗi khi lưu lịch rảnh');
    }
  };

  const handleCancelEdit = () => {
    setSlots(JSON.parse(JSON.stringify(originalSlots)));
    setIsEditing(false);
  };

  // === Các hàm xử lý lịch hẹn (giữ nguyên) ===
  const handleConfirmAppointment = async (id: string) => {
    try {
      await appointmentsAPI.updateStatus(id, { status: "confirmed" });
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: "confirmed" } : a));
      toast.success("Đã xác nhận lịch hẹn");
    } catch {
      toast.error("Không thể xác nhận");
    }
  };

  const handleRejectOrCancel = async (id: string) => {
    try {
      await appointmentsAPI.updateStatus(id, { status: "cancelled" });
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: "cancelled" } : a));
      toast.success(user?.role === "patient" ? "Đã hủy lịch" : "Đã từ chối/hủy lịch");
    } catch {
      toast.error("Thao tác thất bại");
    }
  };

  const handleCompleteAppointment = async (id: string, examStartTime: string, examEndTime: string) => {
    try {
      await appointmentsAPI.updateStatus(id, { status: 'completed', examStartTime, examEndTime });
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'completed', examStartTime, examEndTime } : a));
      toast.success('Đã hoàn thành khám');
      // Invalidate doctor-related queries so dashboards refresh
      if (user?.role === 'doctor') {
        queryClient.invalidateQueries({ queryKey: ['doctor-profile', user.id] });
        queryClient.invalidateQueries({ queryKey: ['doctor-appointments-all', user.id] });
      }
      fetchAppointments();
    } catch (err: any) {
      console.error('Hoàn thành thất bại', err);
      toast.error(err.response?.data?.message || 'Hoàn thành khám thất bại');
    }
  };

  const renderAppointmentType = (type: string) => {
    const map: Record<string, { icon: any; text: string; color: string }> = {
      consultation: { icon: Stethoscope, text: "Khám lần đầu", color: "text-blue-700" },
      follow_up: { icon: Calendar, text: "Tái khám", color: "text-green-700" },
      emergency: { icon: AlertCircle, text: "Khám khẩn cấp", color: "text-red-700" },
      telehealth: { icon: Video, text: "Khám online", color: "text-purple-700" },
    };
    const config = map[type] || { icon: Clock, text: type, color: "text-muted-foreground" };
    const Icon = config.icon;
    return <div className={`flex items-center gap-2 font-medium ${config.color}`}><Icon className="h-4 w-4" /> {config.text}</div>;
  };

  const renderStatusBadge = (status: string) => {
    const config: Record<string, { text: string; className: string }> = {
      confirmed: { text: "Đã xác nhận", className: "bg-green-100 text-green-800" },
      scheduled: { text: "Đã đặt", className: "bg-blue-100 text-blue-800" },
      pending: { text: "Chờ xác nhận", className: "bg-yellow-100 text-yellow-800" },
      in_progress: { text: "Đang khám", className: "bg-purple-100 text-purple-800" },
      completed: { text: "Hoàn thành", className: "bg-emerald-100 text-emerald-800" },
      cancelled: { text: "Đã hủy", className: "bg-red-100 text-red-800" },
      no_show: { text: "Không đến", className: "bg-gray-100 text-gray-700" },
    };
    const c = config[status] || { text: status, className: "bg-gray-100 text-gray-700" };
    return <Badge className={c.className}>{c.text}</Badge>;
  };

  if (!user) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="healthcare-heading text-3xl font-bold">
            {user.role === "patient" ? "Lịch hẹn khám bệnh" : "Quản lý lịch khám"}
          </h1>
          <p className="text-muted-foreground">
            {user.role === "patient" ? "Theo dõi và đặt lịch khám với bác sĩ" : "Quản lý lịch hẹn và lịch rảnh tình nguyện"}
          </p>
        </div>
        {user.role === "patient" && (
          <Button onClick={() => setOpenDialog(true)}>
            <Calendar className="mr-2 h-4 w-4" /> Đặt lịch mới
          </Button>
        )}
      </div>

      {/* Nội dung chính */}
      {user.role === "doctor" ? (
        /* ============== CHẾ ĐỘ BÁC SĨ: 2 TAB ============== */
        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="appointments">Lịch hẹn bệnh nhân</TabsTrigger>
            <TabsTrigger value="availability">Lịch rảnh tình nguyện</TabsTrigger>
          </TabsList>

          {/* Tab 1: Lịch hẹn */}
          <TabsContent value="appointments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lịch hẹn từ bệnh nhân</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">Đang tải...</div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">Chưa có lịch hẹn nào</div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((apt) => {
                      const isPastDue = new Date(apt.scheduledTime).getTime() < Date.now() && ['scheduled', 'pending'].includes(apt.status);
                      return (
                        <div key={apt._id} className="flex items-center justify-between p-5 border rounded-xl hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedAppointment(apt); setOpenAppointmentDetail(true); }}>
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <Clock className="h-7 w-7 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-lg flex items-center gap-2">
                                <User className="h-5 w-5" />
                                {apt.patientId?.userId?.fullName || "Không rõ"}
                              </div>
                              {renderAppointmentType(apt.appointmentType)}
                              <div className="text-sm text-muted-foreground">
                                {new Date(apt.scheduledTime).toLocaleString('vi-VN')}
                              </div>
                              {isPastDue && (
                                <div className="text-sm text-red-600 font-medium mt-1">Lịch hẹn đã quá ngày</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {renderStatusBadge(apt.status)}
                            {apt.status === "scheduled" && !isPastDue && (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={(e) => { e.stopPropagation(); handleConfirmAppointment(apt._id); }}>
                                  <CheckCircle className="h-4 w-4 mr-1" /> Xác nhận
                                </Button>
                                <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleRejectOrCancel(apt._id); }}>
                                  <XCircle className="h-4 w-4 mr-1" /> Từ chối
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Lịch rảnh tình nguyện */}
          <TabsContent value="availability" className="mt-6">
            {!isEditing ? (
              <Card>
                {/* Chỉ hiển thị các ngày chưa quá hạn */}
                {/** Tính toán các slot còn hợp lệ */}
                {(() => {
                  const visibleSlots = slots.filter(s => s.date >= today);
                  return (
                    <>
                      <CardHeader className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-t-lg">
                        <CardTitle className="text-2xl">Lịch rảnh khám tình nguyện</CardTitle>
                        <p className="text-emerald-100">Bạn đã mở {visibleSlots.length} ngày khám miễn phí</p>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {visibleSlots.length === 0 ? (
                          <div className="text-center py-16">
                            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted" />
                            <p className="text-lg mb-6">Chưa mở lịch khám tình nguyện</p>
                            <Button onClick={() => setIsEditing(true)} size="lg">
                              <PlusCircle className="mr-2" /> Mở lịch ngay
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-4 mb-8">
                              {visibleSlots.map((slot, i) => (
                                <div key={i} className="border rounded-xl p-5 hover:shadow-md">
                                  <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-semibold text-lg">
                                      {new Date(slot.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </h3>
                                    <Badge>{slot.times.length} khung giờ</Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {slot.times.map((t: string, j: number) => (
                                      <Badge key={j} variant="outline" className="font-mono">{t}</Badge>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <Button className="w-full" size="lg" onClick={() => setIsEditing(true)}>
                              <Calendar className="mr-2" /> Chỉnh sửa lịch rảnh
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </>
                  );
                })()}
              </Card>
            ) : (
              /* Chế độ chỉnh sửa */
              <Card>
                <CardHeader className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                  <CardTitle>Chỉnh sửa lịch rảnh</CardTitle>
                </CardHeader>
                <CardContent className="pt-8 space-y-6">
                  {slots.map((slot, i) => (
                    <div key={i} className="border rounded-xl p-6 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <Input type="date" value={slot.date} min={today} onChange={e => handleDateChange(i, e.target.value)} className="w-48" />
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteDate(i)}>
                          <Trash2 className="mr-2" /> Xóa ngày
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {slot.times.map((time: string, j: number) => (
                          <div key={j} className="flex items-center gap-2">
                            <Input type="time" value={time} onChange={e => handleTimeChange(i, j, e.target.value)} />
                            <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDeleteTime(i, j)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => handleAddTime(i)}>
                          <PlusCircle className="mr-2" /> Thêm giờ
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full" onClick={handleAddSlot}>
                    <PlusCircle className="mr-2" /> Thêm ngày mới
                  </Button>

                  <div className="flex gap-4 pt-4">
                    <Button className="flex-1" size="lg" onClick={handleSaveAvailability}>
                      <Save className="mr-2" /> Lưu thay đổi
                    </Button>
                    <Button variant="outline" className="flex-1" size="lg" onClick={handleCancelEdit}>
                      Hủy bỏ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        /* ============== CHẾ ĐỘ BỆNH NHÂN ============== */
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Lịch hẹn của tôi</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">Đang tải...</div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-lg">
                Bạn chưa có lịch hẹn nào
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => {
                  const isPastDue = new Date(apt.scheduledTime).getTime() < Date.now() && ['scheduled', 'pending'].includes(apt.status);
                  return (
                    <div key={apt._id} className="flex items-center justify-between p-5 border rounded-xl hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedAppointment(apt); setOpenAppointmentDetail(true); }}>
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <Clock className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-lg">
                            BS. {apt.doctorId?.userId?.fullName || "Chưa phân công"}
                          </div>
                          {renderAppointmentType(apt.appointmentType)}
                          <div className="text-sm text-muted-foreground">
                            {new Date(apt.scheduledTime).toLocaleString('vi-VN')}
                          </div>
                          {isPastDue && (
                            <div className="text-sm text-red-600 font-medium mt-1">Lịch hẹn đã quá ngày</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {renderStatusBadge(apt.status)}
                        {apt.status === "scheduled" && !isPastDue && (
                          <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleRejectOrCancel(apt._id); }}>
                            <XCircle className="h-4 w-4 mr-1" /> Hủy lịch
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AppointmentDetailDialog
        appointment={selectedAppointment}
        open={openAppointmentDetail}
        onOpenChange={setOpenAppointmentDetail}
        onConfirm={async (id: string) => { await handleConfirmAppointment(id); fetchAppointments(); }}
        onCancel={async (id: string) => { await handleRejectOrCancel(id); fetchAppointments(); }}
        onComplete={async (id: string, start: string, end: string) => { await handleCompleteAppointment(id, start, end); fetchAppointments(); }}
      />

      {!isAdmin && <ChatBubble />}
      {openDialog && user.role === "patient" && (
        <BookAppointmentForm
          open={openDialog}
          onOpenChange={setOpenDialog}
          doctor={null}
          onSuccess={fetchAppointments}
        />
      )}
    </motion.div>
  );
}