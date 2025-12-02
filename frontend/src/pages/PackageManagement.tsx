/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import axios from 'axios';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { packagesAPI, registrationsAPI } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import {
  Package, Plus, Edit, Trash2, Upload, Image as ImageIcon,
  FileText, CheckCircle, XCircle, Eye, Users
} from 'lucide-react';

const packageSchema = z.object({
  title: z.string().min(5, 'Tên gói ít nhất 5 ký tự'),
  specialty: z.string().min(1, 'Vui lòng chọn chuyên khoa'),
  shortDescription: z.string().min(10, 'Mô tả ngắn ít nhất 10 ký tự'),
  description: z.string().min(50, 'Mô tả chi tiết ít nhất 50 ký tự'),
  conditions: z.string().min(10, 'Điều kiện áp dụng ít nhất 10 ký tự'),
});

type PackageFormData = z.infer<typeof packageSchema>;

interface PackageItem {
  _id: string;
  title: string;
  image?: string;
  specialty?: string;
  shortDescription?: string;
}

interface Registration {
  _id: string;
  packageTitle: string;
  packageId: string;
  fullName: string;
  phone: string;
  healthIssue: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  rejectReason?: string;
  createdAt: string;
  identityCard: string[];
}

export default function PackageManagement() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | 'all'>('all');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [openReject, setOpenReject] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
  });

  const fetchPackages = async () => {
    try {
      const res = await packagesAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setPackages(list);
    } catch {
      toast.error('Lỗi tải danh sách gói khám');
    }
  };

  const fetchRegistrations = async () => {
    try {
      const res = await registrationsAPI.getAll(); // ← DÙNG CÁI NÀY THAY VÌ axios.get
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setAllRegistrations(list);
    } catch (err: any) {
      console.error('Lỗi tải đơn:', err);
      toast.error(err?.response?.data?.message || 'Không tải được đơn đăng ký');
      setAllRegistrations([]);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchRegistrations();
  }, []);

  const filteredRegistrations = selectedPackageId === 'all'
    ? allRegistrations
    : allRegistrations.filter(reg => reg.packageId === selectedPackageId);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: PackageFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    if (imageFile) formData.append('image', imageFile);
    formData.append('isActive', 'true');

    try {
      if (editingId) {
        await packagesAPI.update(editingId, formData);
        toast.success('Cập nhật thành công!');
      } else {
        await packagesAPI.create(formData);
        toast.success('Tạo gói khám thành công! Đã lên trang chủ');
      }
      closeDialog();
      fetchPackages();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi server');
    }
  };

  const closeDialog = () => {
    setOpen(false);
    reset();
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
  };

  const handleEdit = (pkg: any) => {
    setEditingId(pkg._id);
    setValue('title', pkg.title);
    setValue('specialty', pkg.specialty);
    setValue('shortDescription', pkg.shortDescription || '');
    setValue('description', pkg.description || '');
    setValue('conditions', pkg.conditions || '');
    setImagePreview(pkg.image ? getImageUrl(pkg.image) : null);
    setImageFile(null);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa gói khám này? Sẽ biến mất khỏi trang chủ.')) return;
    try {
      await packagesAPI.delete(id);
      toast.success('Đã xóa');
      fetchPackages();
    } catch {
      toast.error('Lỗi xóa');
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected' | 'processing', reason?: string) => {
    try {
      // ĐÚNG ROUTE: có /status hoặc /admin
      await registrationsAPI.updateStatus(id, { status, rejectReason: reason });
      // HOẶC nếu bạn dùng route khác thì gọi đúng:
      // await axios.patch(`/api/registrations/${id}/status`, { status, rejectReason: reason });

      toast.success(
        status === 'approved' ? 'Đã duyệt đơn thành công!' :
          status === 'rejected' ? 'Đã từ chối đơn' : 'Đã cập nhật trạng thái'
      );
      fetchRegistrations();
      setOpenReject(false);
      setRejectReason('');
      setSelectedReg(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Cập nhật thất bại!');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-800">Đã duyệt</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800">Từ chối</Badge>;
      case 'processing': return <Badge className="bg-blue-100 text-blue-800">Đang xử lý</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Chờ duyệt</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="packages" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="w-5 h-5 mr-2" />
            Gói khám
          </TabsTrigger>

          <TabsTrigger value="registrations" className="flex items-center gap-2">
            <FileText className="w-5 h-5 mr-2" />
            Đơn đăng ký
            <Badge variant="default" className="ml-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold">
              {allRegistrations.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: QUẢN LÝ GÓI KHÁM */}
        <TabsContent value="packages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-3xl font-bold healthcare-heading">Quản lý gói khám miễn phí</CardTitle>
              </div>
              <Button size="lg" onClick={() => { closeDialog(); setOpen(true); }}>
                <Plus className="mr-2" /> Thêm gói mới
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ảnh</TableHead>
                    <TableHead>Gói khám</TableHead>
                    <TableHead>Chuyên khoa</TableHead>
                    <TableHead>Mô tả ngắn</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg._id}>
                      <TableCell>
                        {pkg.image ? (
                          <img src={getImageUrl(pkg.image)} alt={pkg.title} className="w-16 h-16 object-cover rounded-lg" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">{pkg.title}</TableCell>
                      <TableCell>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {pkg.specialty || 'Chưa có'}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{pkg.shortDescription || '—'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(pkg)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(pkg._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: QUẢN LÝ ĐƠN ĐĂNG KÝ */}
        <TabsContent value="registrations" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Sidebar: Danh sách gói khám */}
            <Card className="xl:col-span-1 h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl flex items-center gap-2 healthcare-heading">
                  <Package className="h-5 w-5 " /> Các gói khám
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="p-4 space-y-3">
                    <button
                      onClick={() => setSelectedPackageId('all')}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${selectedPackageId === 'all'
                        ? 'bg-blue-50 border-blue-500 shadow-md'
                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                    >
                      <div className="font-bold text-blue-700">Tất cả gói khám</div>
                      <div className="text-sm text-gray-600 mt-1">{allRegistrations.length} đơn đăng ký</div>
                    </button>

                    {packages.map((pkg) => {
                      const count = allRegistrations.filter(r => r.packageId === pkg._id).length;
                      return (
                        <button
                          key={pkg._id}
                          onClick={() => setSelectedPackageId(pkg._id)}
                          className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 group
                              ${selectedPackageId === pkg._id
                              ? 'bg-emerald-50 border-emerald-500 shadow-lg ring-2 ring-emerald-200'
                              : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                            }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Ảnh gói khám */}
                            {pkg.image ? (
                              <img
                                src={getImageUrl(pkg.image)}
                                alt={pkg.title}
                                className="w-14 h-14 object-cover rounded-xl shadow-md flex-shrink-0 border-2 border-white mt-1"
                              />
                            ) : (
                              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md mt-1">
                                <Package className="h-7 w-7 text-white" />
                              </div>
                            )}

                            {/* Nội dung */}
                            <div className="flex-1 min-w-0">
                              {/* TIÊU ĐỀ HIỆN 2 DÒNG – KHÔNG BỊ CẮT */}
                              <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2">
                                {pkg.title}
                              </h3>

                              {/* Số lượng đơn */}
                              <div className="flex items-center gap-2 mt-2">
                                <Users className="h-4 w-4 text-emerald-600" />
                                <span className="font-semibold text-emerald-700">{count}</span>
                                <span className="text-gray-500 text-xs">đơn đăng ký</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Main: Danh sách đơn đăng ký */}
            <div className="xl:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl healthcare-heading">
                        {selectedPackageId === 'all'
                          ? 'Tất cả đơn đăng ký'
                          : packages.find(p => p._id === selectedPackageId)?.title || 'Đang tải...'
                        }
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Tổng cộng: <strong className="text-lg">{filteredRegistrations.length}</strong> đơn
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredRegistrations.length === 0 ? (
                    <div className="text-center py-20">
                      <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Chưa có đơn đăng ký nào</p>
                      <p className="text-gray-400 text-sm mt-2">Khi có bệnh nhân đăng ký, đơn sẽ xuất hiện tại đây</p>
                    </div>
                  ) : (
                    /* ĐÃ CHỈNH CSS Ở ĐÂY - KHÔNG SCROLL NGANG, NÚT NHỎ GỌN */
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-28">Ngày nộp</TableHead>
                            <TableHead className="w-40">Họ tên</TableHead>
                            <TableHead className="w-32">SĐT</TableHead>
                            <TableHead>Tình trạng bệnh</TableHead>
                            <TableHead className="w-32">Trạng thái</TableHead>
                            <TableHead className="w-40 text-center">Hành động</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRegistrations.map((reg) => (
                            <TableRow key={reg._id} className="hover:bg-gray-50">
                              <TableCell className="text-xs">
                                {format(new Date(reg.createdAt), 'dd/MM/yyyy', { locale: vi })}
                                <br />
                                <span className="text-gray-500">
                                  {format(new Date(reg.createdAt), 'HH:mm', { locale: vi })}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium">{reg.fullName}</TableCell>
                              <TableCell>{reg.phone}</TableCell>
                              <TableCell className="max-w-xs">
                                <p className="text-sm line-clamp-2">{reg.healthIssue}</p>
                              </TableCell>
                              <TableCell>{getStatusBadge(reg.status)}</TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Nút Xem - nhỏ gọn */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2.5 text-xs"
                                    onClick={() => setSelectedReg(reg)}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>

                                  {/* Chỉ hiện khi pending - nút siêu nhỏ */}
                                  {reg.status === 'pending' && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                                        onClick={() => updateStatus(reg._id, 'approved')}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-8 w-8 p-0"
                                        onClick={() => {
                                          setSelectedReg(reg);
                                          setOpenReject(true);
                                        }}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
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

      {/* FORM THÊM/SỬA GÓI KHÁM - ĐÃ CÓ ĐẦY ĐỦ */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl healthcare-heading">
              {editingId ? 'Chỉnh sửa gói khám' : 'Tạo gói khám mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Ảnh */}
            <div>
              <Label>Ảnh gói khám (khuyến khích 800x600)</Label>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-80 object-cover rounded-xl" />
                  <Button type="button" variant="destructive" size="sm" className="absolute top-3 right-3"
                    onClick={() => { setImagePreview(null); setImageFile(null); }}>
                    Xóa ảnh
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-80 border-3 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <Upload className="h-16 w-16 text-gray-400 mb-4" />
                  <span className="text-lg">Click để tải ảnh lên</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label>Tên gói khám *</Label>
                <Input {...register('title')} placeholder="Gói khám tim mạch toàn diện" />
                {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
              </div>
              <div>
                <Label>Chuyên khoa *</Label>
                <Select onValueChange={(v) => setValue('specialty', v)} defaultValue={watch('specialty')}>
                  <SelectTrigger><SelectValue placeholder="Chọn chuyên khoa" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tim mạch">Tim mạch</SelectItem>
                    <SelectItem value="Nhi khoa">Nhi khoa</SelectItem>
                    <SelectItem value="Ung bướu">Ung bướu</SelectItem>
                    <SelectItem value="Mắt">Mắt</SelectItem>
                    <SelectItem value="Răng hàm mặt">Răng hàm mặt</SelectItem>
                    <SelectItem value="Cơ xương khớp">Cơ xương khớp</SelectItem>
                  </SelectContent>
                </Select>
                {errors.specialty && <p className="text-red-500 text-sm">{errors.specialty.message}</p>}
              </div>
            </div>

            <div>
              <Label>Mô tả ngắn *</Label>
              <Textarea {...register('shortDescription')} rows={3} placeholder="Tóm tắt gói khám trong 1-2 câu..." />
              {errors.shortDescription && <p className="text-red-500 text-sm">{errors.shortDescription.message}</p>}
            </div>

            <div>
              <Label>Mô tả chi tiết *</Label>
              <Textarea {...register('description')} rows={6} placeholder="Chi tiết các xét nghiệm, dịch vụ đi kèm..." />
              {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>

            <div>
              <Label>Điều kiện áp dụng *</Label>
              <Textarea {...register('conditions')} rows={4} placeholder="Đối tượng được hưởng, giấy tờ cần chuẩn bị..." />
              {errors.conditions && <p className="text-red-500 text-sm">{errors.conditions.message}</p>}
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" size="lg" onClick={closeDialog}>Hủy</Button>
              <Button type="submit" size="lg">
                {editingId ? 'Cập nhật' : 'Tạo & Đăng lên trang chủ'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog xem chi tiết đơn */}
      <Dialog open={!!selectedReg} onOpenChange={() => setSelectedReg(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn - {selectedReg?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div><strong>Gói:</strong> {selectedReg?.packageTitle}</div>
              <div><strong>SĐT:</strong> {selectedReg?.phone}</div>
              <div><strong>Ngày nộp:</strong> {selectedReg?.createdAt && format(new Date(selectedReg.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</div>
            </div>
            <div>
              <strong>Tình trạng bệnh:</strong>
              <p className="mt-2 text-gray-700">{selectedReg?.healthIssue}</p>
            </div>
            {selectedReg?.identityCard && selectedReg.identityCard.length > 0 && (
              <div>
                <strong>Hình ảnh:</strong>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  {selectedReg.identityCard.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={url} alt={`CMND ${i + 1}`} className="w-full rounded-lg border shadow-sm hover:shadow-md transition-shadow" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog từ chối */}
      <Dialog open={openReject} onOpenChange={setOpenReject}>
        <DialogContent>
          <DialogHeader><DialogTitle>Từ chối đơn đăng ký</DialogTitle></DialogHeader>
          <Textarea placeholder="Nhập lý do từ chối (bắt buộc)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} />
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setOpenReject(false)}>Hủy</Button>
            <Button variant="destructive" disabled={!rejectReason.trim()} onClick={() => updateStatus(selectedReg!._id, 'rejected', rejectReason)}>
              Xác nhận từ chối
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}