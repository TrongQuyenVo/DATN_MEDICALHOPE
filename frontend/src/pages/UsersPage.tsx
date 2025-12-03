/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MoreHorizontal, Shield, ShieldCheck, ShieldX, Edit, Trash2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usersAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';
import { useAuthStore } from "@/stores/authStore";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'patient' | 'doctor' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
  profile?: {
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    address?: string;
    insurance?: string;
    occupation?: string;
  };
  avatar?: string;
}

export default function UsersPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, updateUser } = useAuthStore();

  const isAdmin = user?.role === 'admin';

  // Helper: chuyển "/uploads/..." thành URL đầy đủ (giống ProfilePage / Header)
  const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
  const getAvatarUrl = (avatarPath?: string | null) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    const prefix = API_SERVER.endsWith('/') ? API_SERVER.slice(0, -1) : API_SERVER;
    return `${prefix}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAllUsers();
      const usersData = Array.isArray(response.data.users) ? response.data.users : [];
      const mappedUsers: User[] = usersData.map((user: any) => ({
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        isActive: user.isActive,
        profile: user.profile,
        avatar: user.avatar,
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Không thể lấy danh sách người dùng. Vui lòng thử lại.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'patient': return 'Bệnh nhân';
      case 'doctor': return 'Bác sĩ';
      case 'admin': return 'Quản trị viên';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'patient': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'doctor': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Không hoạt động';
      case 'suspended': return 'Bị đình chỉ';
      default: return status;
    }
  };

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  }) : [];

  const totalUsers = filteredUsers.length;
  const activeUsers = filteredUsers.filter(u => u.status === 'active').length;
  const verifiedUsers = filteredUsers.filter(u => u.isActive).length;
  const newUsersThisMonth = filteredUsers.filter(u =>
    new Date(u.createdAt).getMonth() === new Date().getMonth()
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="healthcare-heading text-3xl font-bold">Quản lý người dùng</h1>
          <p className="healthcare-subtitle">Quản lý tài khoản và quyền hạn người dùng</p>
        </div>

      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="healthcare-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">+{newUsersThisMonth} người mới tháng này</p>
          </CardContent>
        </Card>
        <Card className="healthcare-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
            <ShieldCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">{totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0}% tổng số</p>
          </CardContent>
        </Card>
        <Card className="healthcare-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã xác thực</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{verifiedUsers}</div>
            <p className="text-xs text-muted-foreground">{totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : 0}% đã xác thực</p>
          </CardContent>
        </Card>
        <Card className="healthcare-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bị đình chỉ</CardTitle>
            <ShieldX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {filteredUsers.filter(u => u.status === 'suspended').length}
            </div>
            <p className="text-xs text-muted-foreground">Cần xem xét</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="healthcare-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Lọc theo vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="patient">Bệnh nhân</SelectItem>
                <SelectItem value="doctor">Bác sĩ</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
                <SelectItem value="suspended">Bị đình chỉ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {loading ? (
        <Card className="healthcare-card">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Đang tải dữ liệu...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card className="healthcare-card">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Không tìm thấy người dùng</h3>
              <p className="text-muted-foreground">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="healthcare-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={getAvatarUrl(user.avatar) || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}`}
                          alt={user.fullName}
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            img.onerror = null;
                            img.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}`;
                          }}
                        />
                        <AvatarFallback>{user.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold healthcare-heading">{user.fullName}</h3>
                          {user.isActive && (
                            <ShieldCheck className="h-4 w-4 text-success" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getRoleColor(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                          <Badge className={getStatusColor(user.status)}>
                            {getStatusLabel(user.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
                        <p>Lần cuối: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('vi-VN') : 'Chưa đăng nhập'}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.status === 'active' ? (
                            <DropdownMenuItem className="text-warning">
                              <ShieldX className="mr-2 h-4 w-4" />
                              Đình chỉ
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-success">
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Kích hoạt
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      <ScrollToTop />
      {!isAdmin && <ChatBubble />}
    </motion.div>
  );
}