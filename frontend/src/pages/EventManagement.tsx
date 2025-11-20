/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { eventsAPI, eventRegistrationsAPI } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import {
  Calendar, MapPin, Users, Plus, Edit, Trash2, Upload,
  UserCheck, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const eventSchema = z.object({
  title: z.string().min(5, 'Tên sự kiện ít nhất 5 ký tự'),
  location: z.string().min(3, 'Nhập địa điểm tổ chức'),
  startDate: z.string().min(1, 'Chọn ngày bắt đầu'),
  endDate: z.string().optional(),
  description: z.string().min(20, 'Mô tả ít nhất 20 ký tự'),
  organizer: z.string().min(3, 'Nhập tên đơn vị tổ chức'),
  target: z.coerce.number().min(1, 'Mục tiêu ít nhất 1 người'),
  participants: z.coerce.number().min(0).default(0),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function EventManagement() {
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [regLoading, setRegLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: { participants: 0, target: 100 },
  });

  // === FETCH EVENTS ===
  const fetchEvents = async () => {
    try {
      const res = await eventsAPI.getAll();
      setEvents(res.data?.data || res.data || []);
    } catch {
      toast.error('Lỗi tải danh sách sự kiện');
    }
  };

  // === FETCH REGISTRATIONS BY EVENT ===
  const fetchRegistrations = async (eventId: string) => {
    if (!eventId) return;
    setRegLoading(true);
    try {
      const res = await eventRegistrationsAPI.getByEvent(eventId);
      setRegistrations(res.data);
    } catch {
      toast.error('Lỗi tải danh sách đăng ký');
      setRegistrations([]);
    } finally {
      setRegLoading(false);
    }
  };

  // === FETCH ALL REGISTRATIONS (TẤT CẢ SỰ KIỆN) ===
  const fetchAllRegistrations = async () => {
    setRegLoading(true);
    try {
      const res = await eventRegistrationsAPI.getAll(); // API MỚI
      setRegistrations(res.data);
    } catch {
      toast.error('Lỗi tải danh sách tất cả đăng ký');
      setRegistrations([]);
    } finally {
      setRegLoading(false);
    }
  };

  // === LOAD EVENTS KHI MỞ TRANG ===
  useEffect(() => {
    fetchEvents();
  }, []);

  // === KHI CHỌN SỰ KIỆN HOẶC "TẤT CẢ" → TẢI DANH SÁCH TƯƠNG ỨNG ===
  useEffect(() => {
    if (selectedEventId === '') {
      fetchAllRegistrations();           // HIỆN TẤT CẢ ĐĂNG KÝ
    } else if (selectedEventId) {
      fetchRegistrations(selectedEventId); // HIỆN CỦA 1 SỰ KIỆN
    }
  }, [selectedEventId]);

  // === SUBMIT & EDIT ===
  const onSubmit = async (data: EventFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    if (imageFile) formData.append('image', imageFile);
    formData.append('isActive', 'true');

    try {
      if (editingId) {
        await eventsAPI.update(editingId, formData);
        toast.success('Cập nhật sự kiện thành công!');
      } else {
        await eventsAPI.create(formData);
        toast.success('Tạo sự kiện thành công!');
      }
      closeDialog();
      fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi server');
    }
  };

  const closeDialog = () => {
    setOpen(false);
    reset();
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
  };

  const handleEdit = (event: any) => {
    setEditingId(event._id);
    setValue('title', event.title);
    setValue('location', event.location);
    setValue('startDate', event.startDate.split('T')[0]);
    setValue('endDate', event.endDate ? event.endDate.split('T')[0] : '');
    setValue('description', event.description || '');
    setValue('organizer', event.organizer || '');
    setValue('target', event.target || 100);
    setValue('participants', event.participants || 0);
    setImagePreview(event.image ? getImageUrl(event.image) : null);
    setOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="w-5 h-5 mr-2" />
            Quản lý sự kiện
          </TabsTrigger>
          <TabsTrigger value="registrations" className="flex items-center gap-2">
            Danh sách đăng ký
            <Badge variant="default" className="ml-2 bg-emerald-600 text-white hover:bg-emerald-700">
              {registrations.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: QUẢN LÝ SỰ KIỆN */}
        <TabsContent value="events">
          <Card className="shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-3xl font-bold healthcare-heading">Quản lý sự kiện</CardTitle>
              </div>
              <Button size="lg" onClick={() => { closeDialog(); setOpen(true); }}>
                <Plus className="mr-2 h-5 w-5" /> Thêm sự kiện
              </Button>
            </CardHeader>

            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Ảnh</TableHead>
                    <TableHead className="w-64">Tên sự kiện</TableHead>
                    <TableHead className="w-48">Địa điểm</TableHead>
                    <TableHead className="w-40">Thời gian</TableHead>
                    <TableHead className="w-32 text-center">Tham gia</TableHead>
                    <TableHead className="w-28 text-center">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-lg">
                        Chưa có sự kiện nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((event) => (
                      <TableRow key={event._id} className="hover:bg-orange-50 transition-colors h-20">
                        {/* Ảnh */}
                        <TableCell className="py-3">
                          {event.image ? (
                            <img
                              src={getImageUrl(event.image)}
                              alt={event.title}
                              className="w-16 h-16 object-cover rounded-lg shadow-sm border"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 border-2 border-dashed rounded-lg" />
                          )}
                        </TableCell>

                        {/* Tên sự kiện - giới hạn độ rộng, xuống dòng đẹp */}
                        <TableCell className="font-semibold">
                          <div className="max-w-xs line-clamp-2" title={event.title}>
                            {event.title}
                          </div>
                        </TableCell>

                        {/* Địa điểm */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0" />
                            <span className="truncate max-w-40">{event.location}</span>
                          </div>
                        </TableCell>

                        {/* Thời gian */}
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <div>
                              <div>{new Date(event.startDate).toLocaleDateString('vi-VN')}</div>
                              {event.endDate && (
                                <div className="text-xs text-muted-foreground">
                                  → {new Date(event.endDate).toLocaleDateString('vi-VN')}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Tham gia */}
                        <TableCell className="text-center">
                          <div className="inline-flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full">
                            <Users className="w-4 h-4 text-green-600" />
                            <span className="font-bold text-green-700">{event.participants || 0}</span>
                            <span className="text-muted-foreground text-xs">/{event.target || '?'} </span>
                          </div>
                        </TableCell>

                        {/* Hành động */}
                        <TableCell>
                          <div className="flex gap-1 justify-center">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(event)}>
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm('Xóa sự kiện này? Không thể hoàn tác!')) {
                                  eventsAPI.delete(event._id).then(() => {
                                    toast.success('Đã xóa sự kiện');
                                    fetchEvents();
                                  }).catch(() => toast.error('Xóa thất bại'));
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: DANH SÁCH ĐĂNG KÝ */}
        <TabsContent value="registrations" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Sidebar */}
            <Card className="xl:col-span-1 h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl flex items-center gap-2 healthcare-heading">
                  <Calendar className="h-5 w-5" /> Các sự kiện
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="p-4 space-y-3">
                    <button
                      onClick={() => setSelectedEventId('')}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${selectedEventId === ''
                        ? 'bg-blue-50 border-blue-500 shadow-md'
                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                    >
                      <div className="font-bold text-blue-700">Tất cả sự kiện</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {events.reduce((acc, e) => acc + (e.participants || 0), 0)} người tham gia
                      </div>
                    </button>

                    {events.map((event) => (
                      <button
                        key={event._id}
                        onClick={() => setSelectedEventId(event._id)}
                        className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${selectedEventId === event._id
                          ? 'bg-emerald-50 border-emerald-500 shadow-md'
                          : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          {event.image ? (
                            <img src={getImageUrl(event.image)} alt={event.title} className="w-12 h-12 object-cover rounded-lg shadow-sm" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{event.title}</div>
                            <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Users className="h-3.5 w-3.5" />
                              {event.participants || 0} người
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Main Table */}
            <div className="xl:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl healthcare-heading">
                    {selectedEventId === '' ? 'Tất cả người đăng ký tham gia' : events.find(e => e._id === selectedEventId)?.title || 'Đang tải...'}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Tổng cộng: <strong className="text-lg">{registrations.length}</strong> người
                  </p>
                </CardHeader>

                <CardContent className="p-0">
                  {regLoading ? (
                    <div className="text-center py-20">
                      <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-emerald-500 border-t-transparent"></div>
                      <p className="mt-6 text-lg text-gray-600">Đang tải danh sách...</p>
                    </div>
                  ) : registrations.length === 0 ? (
                    <div className="text-center py-20">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">
                        {selectedEventId === '' ? 'Chưa có đăng ký nào' : 'Chưa có ai đăng ký sự kiện này'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-32">Ngày đăng ký</TableHead>
                            <TableHead className="w-40">Họ tên</TableHead>
                            <TableHead className="w-32">SĐT</TableHead>
                            <TableHead className="w-48">Email</TableHead>
                            <TableHead className="w-40 text-center">Thời gian</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {registrations.map((reg) => (
                            <TableRow key={reg._id} className="hover:bg-emerald-50 transition-colors">
                              <TableCell className="text-xs">
                                {format(new Date(reg.registeredAt || reg.createdAt), 'dd/MM/yyyy', { locale: vi })}
                                <br />
                                <span className="text-gray-500">
                                  {format(new Date(reg.registeredAt || reg.createdAt), 'HH:mm', { locale: vi })}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium">{reg.fullName}</TableCell>
                              <TableCell>{reg.phone}</TableCell>
                              <TableCell>
                                {reg.email ? (
                                  <span className="text-blue-600 text-sm">{reg.email}</span>
                                ) : (
                                  <span className="text-gray-400 italic">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center text-xs text-gray-600">
                                {format(new Date(reg.registeredAt || reg.createdAt), 'HH:mm dd/MM', { locale: vi })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* === DIALOG TẠO/SỬA SỰ KIỆN – DÁN NGUYÊN VÀO ĐÂY === */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl healthcare-heading">
              {editingId ? 'Sửa sự kiện' : 'Thêm sự kiện mới'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Ảnh sự kiện */}
            <div>
              <Label className="text-lg">Ảnh sự kiện</Label>
              {imagePreview ? (
                <div className="relative rounded-lg overflow-hidden shadow-lg">
                  <img src={imagePreview} alt="Preview" className="w-full h-80 object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-3 right-3"
                    onClick={() => { setImagePreview(null); setImageFile(null); }}
                  >
                    Xóa ảnh
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-80 border-4 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Upload className="w-16 h-16 text-gray-400 mb-4" />
                  <span className="text-lg font-medium text-gray-600">Click để upload ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onload = () => setImagePreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {/* Dòng 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Tên sự kiện *</Label>
                <Input {...register('title')} placeholder="Hiến máu nhân đạo 2025" />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <Label>Đơn vị tổ chức *</Label>
                <Input {...register('organizer')} placeholder="Hội Chữ thập đỏ TP.HCM" />
                {errors.organizer && <p className="text-red-500 text-sm mt-1">{errors.organizer.message}</p>}
              </div>
            </div>

            {/* Địa điểm */}
            <div>
              <Label>Địa điểm *</Label>
              <Input {...register('location')} placeholder="Nhà văn hóa Thanh Niên, Q.1" />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
            </div>

            {/* Ngày */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Ngày bắt đầu *</Label>
                <Input type="date" {...register('startDate')} />
                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>}
              </div>
              <div>
                <Label>Ngày kết thúc</Label>
                <Input type="date" {...register('endDate')} />
              </div>
            </div>

            {/* Mục tiêu & Đã tham gia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Mục tiêu (người tham gia)</Label>
                <Input type="number" {...register('target')} placeholder="200" />
                {errors.target && <p className="text-red-500 text-sm mt-1">{errors.target.message}</p>}
              </div>
              <div>
                <Label>Đã tham gia</Label>
                <Input type="number" {...register('participants')} disabled={!!editingId} />
              </div>
            </div>

            {/* Mô tả */}
            <div>
              <Label>Mô tả chi tiết *</Label>
              <Textarea
                {...register('description')}
                rows={5}
                placeholder="Mục đích, nội dung, đối tượng tham gia, yêu cầu..."
                className="resize-none"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            {/* Nút */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" size="lg" onClick={closeDialog}>Hủy</Button>
              <Button type="submit" size="lg">
                {editingId ? 'Cập nhật' : 'Tạo ngay'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}