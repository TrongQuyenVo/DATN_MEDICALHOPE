/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Plus, Edit, Trash2,
  Phone, MapPin, Clock, Users, Image as ImageIcon, Globe, Bus, Mail,
  ChevronLeft, ChevronRight
} from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Partner {
  _id: string;
  name: string;
  type: 'transportation' | 'food_distribution' | 'organization';
  category: string;
  website?: string;
  logo?: string;
  details?: {
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
  const isAdmin = user?.role === 'admin' || user?.role === 'charity_admin';
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

      // Các field chính
      data.append('name', formData.name);
      data.append('type', formData.type);
      data.append('category', formData.category);
      if (formData.website) data.append('website', formData.website);
      if (formData.logo instanceof File) data.append('logo', formData.logo);
      data.append('isActive', formData.isActive.toString());

      // Gửi từng field details riêng biệt
      const d = formData.details;
      if (d.phone) data.append('phone', d.phone);
      if (d.description) data.append('description', d.description);
      if (d.location) data.append('location', d.location);
      if (d.schedule) data.append('schedule', d.schedule);
      if (d.organizer) data.append('organizer', d.organizer);
      if (d.departure) data.append('departure', d.departure);
      if (d.destination) data.append('destination', d.destination);
      if (d.email) data.append('email', d.email);
      if (d.activities && d.activities.length > 0) {
        data.append('activities', d.activities.join(','));
      }

      let updatedPartner;
      if (editingPartner) {
        const res = await partnersAPI.update(editingPartner._id, data);
        updatedPartner = res.data.partner;
        setPartners(prev => prev.map(p => p._id === editingPartner._id ? updatedPartner : p));
      } else {
        const res = await partnersAPI.create(data);
        updatedPartner = res.data.partner;
        setPartners(prev => [updatedPartner, ...prev]);
      }

      closeForm();
      fetchPartners();
    } catch (err: any) {
      console.error(err);
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
      fetchPartners();
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
    setFormData({ ...formData, details: { ...formData.details, activities } });
  };

  // Kiểm tra quyền
  if (!user || !['admin', 'charity_admin'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600 font-medium">Bạn không có quyền truy cập trang này</p>
      </div>
    );
  }

  const renderPartnerTable = (filteredPartners: Partner[], emptyMessage: string) => {
    if (loading && filteredPartners.length === 0) {
      return <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>;
    }

    if (filteredPartners.length === 0) {
      return <div className="p-8 text-center text-muted-foreground">{emptyMessage}</div>;
    }

    return (
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Logo</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tên</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Thông tin</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPartners.map((partner) => {
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
                    <td className="px-6 py-4 font-medium">{partner.name}</td>
                    <td className="px-6 py-4 text-sm max-w-md">
                      {/* Nhà xe */}
                      {partner.type === 'transportation' && (
                        <div className="space-y-1 text-muted-foreground">
                          {partner.details?.departure && partner.details?.destination && (
                            <div className="flex items-center gap-1 text-xs">
                              <MapPin className="h-3 w-3" />
                              {partner.details.departure} → {partner.details.destination}
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
                            <p className="text-xs line-clamp-2 mt-1">{partner.details.description}</p>
                          )}
                        </div>
                      )}

                      {/* Phát đồ ăn */}
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

                      {/* Tổ chức */}
                      {partner.type === 'organization' && (
                        <div className="space-y-1 text-muted-foreground">
                          {partner.website && (
                            <div className="mb-1">
                              <a
                                href={partner.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-xs flex items-center gap-1 font-medium"
                              >
                                <Globe className="h-3 w-3" /> Website
                              </a>
                            </div>
                          )}
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
                          {partner.details?.activities?.length > 0 && (
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
                    <td className="px-6 py-4">
                      <Badge variant={partner.isActive ? 'default' : 'secondary'}>
                        {partner.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
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
      </div>
    );
  };

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
          <p className="text-muted-foreground mt-1">Quản lý nhà xe, điểm phát đồ ăn và tổ chức hỗ trợ</p>
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
              Điền thông tin chi tiết. Logo là tùy chọn.
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
                  placeholder="VD: Nhà xe Minh Tâm"
                />
              </div>
              <div>
                <Label htmlFor="type">Loại đối tác *</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as Partner['type'] })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transportation">Nhà xe</SelectItem>
                    <SelectItem value="food_distribution">Điểm phát đồ ăn</SelectItem>
                    <SelectItem value="organization">Tổ chức</SelectItem>
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
                  placeholder="VD: Vận chuyển liên tỉnh, Cơm từ thiện..."
                />
              </div>

              {formData.type === 'organization' && (
                <div>
                  <Label htmlFor="website">Website (tùy chọn)</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.org"
                  />
                </div>
              )}
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

            {/* Nhà xe */}
            {formData.type === 'transportation' && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-primary flex items-center gap-2">
                  <Bus className="h-5 w-5" /> Thông tin nhà xe
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Địa điểm</Label>
                    <Input
                      value={formData.details.location || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, location: e.target.value }
                      })}
                      placeholder="VD: Bến xe Mỹ Đình, Hà Nội"
                    />
                  </div>
                  <div>
                    <Label>SĐT</Label>
                    <Input
                      value={formData.details.phone || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, phone: e.target.value }
                      })}
                      placeholder="VD: 0987 654 321"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Mô tả</Label>
                    <Input
                      value={formData.details.description || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, description: e.target.value }
                      })}
                      placeholder="Hỗ trợ vé xe miễn phí cho bệnh nhân nghèo..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Phát đồ ăn */}
            {formData.type === 'food_distribution' && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-primary flex items-center gap-2">
                  <Users className="h-5 w-5" /> Điểm phát đồ ăn
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Địa điểm</Label>
                    <Input
                      value={formData.details.location}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, location: e.target.value } })}
                      placeholder="123 Đường ABC, Quận 1"
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
                    <Label>SĐT</Label>
                    <Input
                      value={formData.details.phone}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, phone: e.target.value } })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Mô tả</Label>
                    <Input
                      value={formData.details.description}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, description: e.target.value } })}
                      placeholder="Phát cơm từ thiện miễn phí..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tổ chức */}
            {formData.type === 'organization' && (
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
                      placeholder="Hà Nội, Việt Nam"
                    />
                  </div>
                  <div>
                    <Label>SĐT liên hệ</Label>
                    <Input
                      value={formData.details.phone}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, phone: e.target.value } })}
                      placeholder="024-3942-2030"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={formData.details.email}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, email: e.target.value } })}
                      placeholder="info@org.org"
                    />
                  </div>
                  <div>
                    <Label>Hoạt động (phân cách bằng dấu phẩy)</Label>
                    <Input
                      value={formData.details.activities?.join(', ')}
                      onChange={(e) => handleActivitiesChange(e.target.value)}
                      placeholder="Y tế, giáo dục, cứu trợ"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Mô tả</Label>
                    <Input
                      value={formData.details.description}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, description: e.target.value } })}
                      placeholder="Hỗ trợ y tế cho người nghèo..."
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

      {/* Tabs */}
      <Tabs defaultValue="transportation" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="transportation" className="flex items-center gap-2">
            <Bus className="h-4 w-4" /> Nhà xe
            <Badge variant="secondary" className="ml-1">
              {partners.filter(p => p.type === 'transportation').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="food_distribution" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Phát đồ ăn
            <Badge variant="secondary" className="ml-1">
              {partners.filter(p => p.type === 'food_distribution').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Tổ chức
            <Badge variant="secondary" className="ml-1">
              {partners.filter(p => p.type === 'organization').length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transportation">
          {renderPartnerTable(partners.filter(p => p.type === 'transportation'), 'Chưa có nhà xe nào')}
        </TabsContent>

        <TabsContent value="food_distribution">
          {renderPartnerTable(partners.filter(p => p.type === 'food_distribution'), 'Chưa có điểm phát đồ ăn nào')}
        </TabsContent>

        <TabsContent value="organization">
          {renderPartnerTable(partners.filter(p => p.type === 'organization'), 'Chưa có tổ chức nào')}
        </TabsContent>
      </Tabs>

      <ScrollToTop />
      {!isAdmin && <ChatBubble />}
    </motion.div>
  );
}