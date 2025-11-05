/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Plus, Edit, Trash2, ExternalLink,
  Phone, MapPin, Clock, Users, Image as ImageIcon, Globe, Bus, Mail,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { partnersAPI } from '@/lib/api';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';

interface Partner {
  _id: string;
  name: string;
  type: 'hospital' | 'charity' | 'international_organization' | 'association' | 'transportation' | 'food_distribution';
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
    departure?: string;
    destination?: string;
    email?: string;
    activities?: string[];
  };
  isActive: boolean;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function PartnerManagement() {
  const { user } = useAuthStore();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '' as Partner['type'],
    category: '',
    website: '',
    logo: null as File | null,
    details: {
      title: '',
      phone: '',
      description: '',
      location: '',
      schedule: '',
      organizer: '',
      departure: '',
      destination: '',
      email: '',
      activities: [] as string[],
    },
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

  // Fetch partners
  useEffect(() => {
    fetchPartners();
  }, [pagination.page, pagination.limit]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await partnersAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
      });

      const partnerList = Array.isArray(response?.data?.data) ? response.data.data : [];
      setPartners(partnerList);

      setPagination({
        total: response.data?.pagination?.total || 0,
        page: response.data?.pagination?.page || 1,
        limit: response.data?.pagination?.limit || 10,
        totalPages: response.data?.pagination?.totalPages || 1,
      });
    } catch (err: any) {
      console.error('Lỗi tải đối tác:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách đối tác');
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, logo: e.target.files[0] });
    }
  };

  const handleAddPartner = async () => {
    if (!formData.name || !formData.type || !formData.category) {
      setError('Vui lòng điền đầy đủ Tên, Loại và Danh mục');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('type', formData.type);
      data.append('category', formData.category);
      data.append('website', formData.website);
      if (formData.logo) data.append('logo', formData.logo);
      data.append('details', JSON.stringify({
        ...formData.details,
        activities: formData.details.activities?.length ? formData.details.activities : undefined,
      }));
      data.append('isActive', formData.isActive.toString());

      let updatedPartner;
      if (editingPartner) {
        const res = await partnersAPI.update(editingPartner._id, data);
        updatedPartner = res.data.partner;
        setPartners(partners.map(p => p._id === editingPartner._id ? updatedPartner : p));
      } else {
        const res = await partnersAPI.create(data);
        updatedPartner = res.data.partner;
        setPartners([updatedPartner, ...partners]);
      }

      closeForm();
      fetchPartners(); // Tải lại danh sách
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lưu đối tác thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      type: partner.type,
      category: partner.category,
      website: partner.website || '',
      logo: null,
      details: {
        title: partner.details?.title || '',
        phone: partner.details?.phone || '',
        description: partner.details?.description || '',
        location: partner.details?.location || '',
        schedule: partner.details?.schedule || '',
        organizer: partner.details?.organizer || '',
        departure: partner.details?.departure || '',
        destination: partner.details?.destination || '',
        email: partner.details?.email || '',
        activities: partner.details?.activities || [],
      },
      isActive: partner.isActive,
    });
    setIsFormOpen(true);
  };

  const handleDeletePartner = async (id: string) => {
    if (!window.confirm('Xóa đối tác này? Hành động không thể hoàn tác.')) return;
    try {
      await partnersAPI.delete(id);
      setPartners(partners.filter(p => p._id !== id));
      fetchPartners(); // Cập nhật phân trang
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingPartner(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '' as Partner['type'],
      category: '',
      website: '',
      logo: null,
      details: {
        title: '',
        phone: '',
        description: '',
        location: '',
        schedule: '',
        organizer: '',
        departure: '',
        destination: '',
        email: '',
        activities: [],
      },
      isActive: true,
    });
    setError(null);
  };

  const handleActivitiesChange = (value: string) => {
    const activities = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData({
      ...formData,
      details: { ...formData.details, activities }
    });
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Kiểm tra quyền
  if (!user || !['admin', 'charity_admin'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600 font-medium">Bạn không có quyền truy cập trang này</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold healthcare-heading flex items-center gap-2">
            Quản lý đối tác
          </h1>
          <p className="text-muted-foreground mt-1">Quản lý bệnh viện, nhà xe, điểm phát đồ ăn, tổ chức từ thiện...</p>
        </div>
        <Button onClick={() => { setIsFormOpen(true); resetForm(); }}>
          <Plus className="h-4 w-4 mr-2" /> Thêm đối tác
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={closeForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingPartner ? 'Chỉnh sửa đối tác' : 'Thêm đối tác mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết. Logo và website là tùy chọn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Tên đối tác *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Bệnh viện Bạch Mai"
                />
              </div>
              <div>
                <Label htmlFor="type">Loại đối tác *</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as Partner['type'] })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospital">Bệnh viện</SelectItem>
                    <SelectItem value="charity">Tổ chức từ thiện</SelectItem>
                    <SelectItem value="international_organization">Tổ chức quốc tế</SelectItem>
                    <SelectItem value="association">Hiệp hội</SelectItem>
                    <SelectItem value="transportation">Nhà xe (Vận chuyển)</SelectItem>
                    <SelectItem value="food_distribution">Điểm phát đồ ăn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Danh mục *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="VD: Bệnh viện, Nhà xe liên tỉnh..."
                />
              </div>
              <div>
                <Label htmlFor="website">Website (tùy chọn)</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://nhaxeabc.com"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <Label htmlFor="logo">Logo (khuyến khích)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {formData.logo && (
                  <Badge variant="secondary" className="whitespace-nowrap">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    {formData.logo.name.slice(0, 20)}...
                  </Badge>
                )}
              </div>
            </div>

            {/* Conditional Fields - Nhà xe */}
            {formData.type === 'transportation' && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-primary flex items-center gap-2">
                  <Bus className="h-5 w-5" /> Thông tin nhà xe
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Điểm xuất phát *</Label>
                    <Input
                      value={formData.details.departure}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, departure: e.target.value }
                      })}
                      placeholder="VD: Hà Nội"
                      required
                    />
                  </div>
                  <div>
                    <Label>Điểm đến *</Label>
                    <Input
                      value={formData.details.destination}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, destination: e.target.value }
                      })}
                      placeholder="VD: TP.HCM, Đà Nẵng"
                      required
                    />
                  </div>
                  <div>
                    <Label>SĐT liên hệ *</Label>
                    <Input
                      value={formData.details.phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, phone: e.target.value }
                      })}
                      placeholder="0901234567"
                      required
                    />
                  </div>
                  <div>
                    <Label>Khung giờ xe chạy *</Label>
                    <Input
                      value={formData.details.schedule}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, schedule: e.target.value }
                      })}
                      placeholder="VD: 5h, 7h, 9h, 13h, 17h"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Mô tả dịch vụ</Label>
                    <Input
                      value={formData.details.description}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, description: e.target.value }
                      })}
                      placeholder="Hỗ trợ vé miễn phí cho bệnh nhân nghèo..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Fields - Điểm phát đồ ăn */}
            {formData.type === 'food_distribution' && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-primary flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Thông tin điểm phát đồ ăn
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Địa điểm</Label>
                    <Input
                      value={formData.details.location}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, location: e.target.value } })}
                      placeholder="Số 123, Đường ABC, Quận 1"
                    />
                  </div>
                  <div>
                    <Label>Lịch phát</Label>
                    <Input
                      value={formData.details.schedule}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, schedule: e.target.value } })}
                      placeholder="Thứ 2, 4, 6: 11h - 13h"
                    />
                  </div>
                  <div>
                    <Label>Tổ chức</Label>
                    <Input
                      value={formData.details.organizer}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, organizer: e.target.value } })}
                      placeholder="Nhóm thiện nguyện XYZ"
                    />
                  </div>
                  <div>
                    <Label>Mô tả</Label>
                    <Input
                      value={formData.details.description}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, description: e.target.value } })}
                      placeholder="Phát cơm từ thiện..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Fields - Hospital, Charity, etc. */}
            {['hospital', 'charity', 'international_organization', 'association'].includes(formData.type) && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-primary flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> Thông tin tổ chức
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Địa điểm</Label>
                    <Input
                      value={formData.details.location}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, location: e.target.value } })}
                      placeholder="VD: Hà Nội, Việt Nam"
                    />
                  </div>
                  <div>
                    <Label>SĐT liên hệ</Label>
                    <Input
                      value={formData.details.phone}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, phone: e.target.value } })}
                      placeholder="VD: 024-3942-2030"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={formData.details.email}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, email: e.target.value } })}
                      placeholder="VD: info@organization.org"
                    />
                  </div>
                  <div>
                    <Label>Hoạt động (phân cách bằng dấu phẩy)</Label>
                    <Input
                      value={formData.details.activities?.join(', ')}
                      onChange={(e) => handleActivitiesChange(e.target.value)}
                      placeholder="VD: Cứu trợ khẩn cấp, Y tế cộng đồng"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Mô tả</Label>
                    <Input
                      value={formData.details.description}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, description: e.target.value } })}
                      placeholder="VD: Hỗ trợ y tế cho người nghèo..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeForm} disabled={loading}>
              Hủy
            </Button>
            <Button onClick={handleAddPartner} disabled={loading}>
              {loading ? 'Đang lưu...' : (editingPartner ? 'Cập nhật' : 'Thêm mới')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        {loading && partners.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>
        ) : partners.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Chưa có đối tác nào. Hãy thêm mới!</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Logo</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tên</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Loại</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Thông tin</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {partners.map((partner) => {
                    const logoUrl = partner.logo
                      ? (partner.logo.startsWith('http') ? partner.logo : `${API_SERVER}${partner.logo}`)
                      : null;

                    return (
                      <tr key={partner._id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 w-[50px]">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={partner.name}
                              className="h-10 w-10 rounded-full object-contain bg-white p-1 shadow-sm"
                              onError={(e) => {
                                e.currentTarget.src = '/default-logo.png';
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 border-2 border-dashed flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-1 py-4 font-medium w-[100px]">{partner.name}</td>
                        <td className="px-3 py-4 w-[80px]">
                          <Badge variant="secondary">
                            {partner.type === 'hospital' && 'Bệnh viện'}
                            {partner.type === 'charity' && 'Từ thiện'}
                            {partner.type === 'international_organization' && 'Quốc tế'}
                            {partner.type === 'association' && 'Hiệp hội'}
                            {partner.type === 'transportation' && 'Nhà xe'}
                            {partner.type === 'food_distribution' && 'Phát đồ ăn'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm w-[230px]">
                          {partner.website && (
                            <div className="mb-2">
                              <a
                                href={partner.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-xs flex items-center gap-1 font-medium"
                              >
                                <Globe className="h-3 w-3" />
                                Xem website
                              </a>
                            </div>
                          )}
                          {partner.type === 'transportation' && (
                            <div className="space-y-1 text-muted-foreground">
                              {partner.details?.departure && partner.details?.destination && (
                                <div className="flex items-center gap-1 text-xs">
                                  <MapPin className="h-3 w-3" />
                                  {partner.details.departure} to {partner.details.destination}
                                </div>
                              )}
                              {partner.details?.phone && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Phone className="h-3 w-3" /> {partner.details.phone}
                                </div>
                              )}
                              {partner.details?.schedule && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Clock className="h-3 w-3" /> {partner.details.schedule}
                                </div>
                              )}
                              {partner.details?.description && (
                                <p className="text-xs line-clamp-2">{partner.details.description}</p>
                              )}
                            </div>
                          )}
                          {partner.type === 'food_distribution' && (
                            <div className="space-y-1 text-muted-foreground">
                              {partner.details?.location && (
                                <div className="flex items-center gap-1 text-xs">
                                  <MapPin className="h-3 w-3" /> {partner.details.location}
                                </div>
                              )}
                              {partner.details?.schedule && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Clock className="h-3 w-3" /> {partner.details.schedule}
                                </div>
                              )}
                              {partner.details?.organizer && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Users className="h-3 w-3" /> {partner.details.organizer}
                                </div>
                              )}
                              {partner.details?.description && (
                                <p className="text-xs line-clamp-2 mt-1">{partner.details.description}</p>
                              )}
                            </div>
                          )}
                          {['hospital', 'charity', 'international_organization', 'association'].includes(partner.type) && (
                            <div className="space-y-1 text-muted-foreground">
                              {partner.details?.location && (
                                <div className="flex items-center gap-1 text-xs">
                                  <MapPin className="h-3 w-3" /> {partner.details.location}
                                </div>
                              )}
                              {partner.details?.phone && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Phone className="h-3 w-3" /> {partner.details.phone}
                                </div>
                              )}
                              {partner.details?.email && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Mail className="h-3 w-3" /> {partner.details.email}
                                </div>
                              )}
                              {partner.details?.activities?.length && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Users className="h-3 w-3" />
                                  <span className="line-clamp-1">{partner.details.activities.join(', ')}</span>
                                </div>
                              )}
                              {partner.details?.description && (
                                <p className="text-xs line-clamp-2 mt-1">{partner.details.description}</p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 w-[100px]">
                          <Badge variant={partner.isActive ? 'default' : 'secondary'}>
                            {partner.isActive ? 'Hoạt động' : 'Tạm dừng'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 w-[100px]">
                          <Button size="sm" variant="ghost" onClick={() => handleEditPartner(partner)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeletePartner(partner._id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong {pagination.total} đối tác
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Trang {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ScrollToTop />
      <ChatBubble />
    </motion.div>
  );
}