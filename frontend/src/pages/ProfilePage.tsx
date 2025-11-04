import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User, Upload, X } from "lucide-react";
import { usersAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import ScrollToTop from "@/components/layout/ScrollToTop";
import ChatBubble from "./ChatbotPage";

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'charity_admin';

  // 🆕 XỬ LÝ URL AVATAR TỪ BACKEND
  const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

  const getAvatarUrl = (avatarPath: string | null | undefined): string | null => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    // đảm bảo không có double slash
    const prefix = API_SERVER.endsWith('/') ? API_SERVER.slice(0, -1) : API_SERVER;
    return `${prefix}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
  };

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phone: user.phone || "",
        profile: {
          dateOfBirth: user.profile?.dateOfBirth
            ? format(new Date(user.profile.dateOfBirth), "yyyy-MM-dd")
            : "",
          gender: user.profile?.gender || "",
          address: user.profile?.address || "",
          insurance: user.profile?.insurance || "",
          occupation: user.profile?.occupation || "",
        },
      });

      // 🆕 XỬ LÝ AVATAR URL
      const avatarUrl = getAvatarUrl(user.avatar);
      setAvatarPreview(avatarUrl);
      setAvatarError(false);
    }
  }, [user]);

  // 🆕 RESET AVATAR ERROR KHI THAY ĐỔI
  useEffect(() => {
    if (avatarPreview) {
      const img = new Image();
      img.onload = () => setAvatarError(false);
      img.onerror = () => setAvatarError(true);
      img.src = avatarPreview;
    }
  }, [avatarPreview]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Vui lòng chọn file ảnh!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
      setAvatarError(false);
    };
    reader.readAsDataURL(file);

    setFormData(prev => ({ ...prev, avatar: file }));
  };

  // 🆕 GỘP AVATAR VÀ DỮ LIỆU KHÁC TRONG 1 REQUEST multipart/form-data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      let res;
      // nếu có avatar, gửi multipart
      if (formData.avatar && typeof formData.avatar === 'object') {
        setUploading(true);
        const fd = new FormData();
        fd.append('avatar', formData.avatar);
        fd.append('fullName', formData.fullName || '');
        fd.append('phone', formData.phone || '');
        // gửi profile như chuỗi JSON để backend parse
        fd.append('profile', JSON.stringify({
          dateOfBirth: formData.profile?.dateOfBirth || '',
          gender: formData.profile?.gender || '',
          address: formData.profile?.address || '',
          insurance: formData.profile?.insurance || '',
          occupation: formData.profile?.occupation || '',
        }));

        res = await usersAPI.updateProfile(fd);
        setUploading(false);
      } else {
        // bình thường gửi json
        const payload = {
          fullName: formData.fullName,
          phone: formData.phone,
          profile: {
            dateOfBirth: formData.profile?.dateOfBirth || '',
            gender: formData.profile?.gender || '',
            address: formData.profile?.address || '',
            insurance: formData.profile?.insurance || '',
            occupation: formData.profile?.occupation || '',
          },
        };
        res = await usersAPI.updateProfile(payload);
      }

      toast.success("Cập nhật hồ sơ thành công!");
      // cập nhật store và avatar preview từ backend (nếu có)
      updateUser(res.data.user);
      const newAvatarUrl = getAvatarUrl(res.data.user.avatar);
      setAvatarPreview(newAvatarUrl);
      setAvatarError(false);
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể cập nhật hồ sơ");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (["dateOfBirth", "gender", "address", "insurance", "occupation"].includes(name)) {
      setFormData((prev: any) => ({
        ...prev,
        profile: { ...prev.profile, [name]: value },
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  if (!formData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground">
          {isEditing ? "Chỉnh sửa thông tin của bạn" : "Xem thông tin tài khoản"}
        </p>
      </div>

      <Card className="healthcare-card">
        <CardHeader className="flex flex-row items-start space-x-6 pb-6">
          <div className="relative flex-shrink-0">
            <Avatar className="w-24 h-24 ring-2 ring-background shadow-lg">
              {!avatarError && avatarPreview && (
                <AvatarImage
                  src={avatarPreview}
                  alt={formData.fullName}
                  onError={() => {
                    setAvatarError(true);
                    setAvatarPreview(null);
                  }}
                />
              )}
              <AvatarFallback className="w-24 h-24 text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {formData.fullName
                  ? formData.fullName.split(" ").map(n => n[0]).join("").toUpperCase()
                  : <User className="h-12 w-12" />
                }
              </AvatarFallback>
            </Avatar>

            {!isAdmin && isEditing && (
              <div className="absolute -bottom-2 -right-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="rounded-full w-10 h-10 p-0 shadow-lg hover:bg-primary/90"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Upload className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          <div className="flex-1">
            <CardTitle className="text-2xl">{formData.fullName || "Khách hàng"}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="capitalize">{user?.role || "người dùng"}</span>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {/* ADMIN / CHARITY_ADMIN: Chỉ xem cơ bản */}
          {isAdmin ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Họ và tên</p>
                  <p className="font-medium">{formData.fullName || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{formData.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vai trò</p>
                  <p className="font-medium capitalize">{user?.role || "—"}</p>
                </div>
              </div>
            </div>
          ) : !isEditing ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{formData.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vai trò</p>
                  <p className="font-medium capitalize">{user?.role || "—"}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-6 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Ngày sinh</p>
                  <p className="font-medium">
                    {formData.profile.dateOfBirth
                      ? format(new Date(formData.profile.dateOfBirth), "dd/MM/yyyy")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Giới tính</p>
                  <p className="font-medium">
                    {formData.profile.gender === "male"
                      ? "Nam"
                      : formData.profile.gender === "female"
                        ? "Nữ"
                        : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Địa chỉ</p>
                  <p className="font-medium">{formData.profile.address || "—"}</p>
                </div>
                {user?.role !== "doctor" && (
                  <div>
                    <p className="text-sm text-muted-foreground">Bảo hiểm y tế</p>
                    <p className="font-medium">{formData.profile.insurance || "—"}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Nghề nghiệp</p>
                  <p className="font-medium">{formData.profile.occupation || "—"}</p>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Cập nhật hồ sơ
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Họ và tên</label>
                  <Input name="fullName" value={formData.fullName} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={user?.email || ""} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Số điện thoại</label>
                  <Input name="phone" value={formData.phone} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-sm font-medium">Vai trò</label>
                  <Input value={user?.role || ""} disabled />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-6 border-t">
                <div>
                  <label className="text-sm font-medium">Ngày sinh</label>
                  <Input
                    type="date"
                    name="dateOfBirth"
                    value={formData.profile.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Giới tính</label>
                  <select
                    name="gender"
                    value={formData.profile.gender}
                    onChange={handleChange}
                    className="border rounded-md w-full h-10 px-2"
                  >
                    <option value="">-- Chọn giới tính --</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Địa chỉ</label>
                  <Input name="address" value={formData.profile.address} onChange={handleChange} />
                </div>
                {user?.role !== "doctor" && (
                  <div>
                    <label className="text-sm font-medium">Bảo hiểm y tế</label>
                    <Input name="insurance" value={formData.profile.insurance} onChange={handleChange} />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Nghề nghiệp</label>
                  <Input name="occupation" value={formData.profile.occupation} onChange={handleChange} />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={loading || uploading}>
                  {loading || uploading ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      <ScrollToTop />
      <ChatBubble />
    </motion.div>
  );
}