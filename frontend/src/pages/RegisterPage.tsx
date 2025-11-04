import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Heart, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loading } from '@/components/ui/loading';

import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';

const schema = yup.object({
  fullName: yup.string().required('Họ và tên là bắt buộc'),
  email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
  phone: yup.string().required('Số điện thoại là bắt buộc'),
  password: yup.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').required('Mật khẩu là bắt buộc'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Xác nhận mật khẩu là bắt buộc'),
  role: yup.string().required('Vai trò là bắt buộc'),

  // chỉ yêu cầu khi role = doctor
  experience: yup.string().when('role', {
    is: 'doctor',
    then: (schema) => schema.required('Kinh nghiệm là bắt buộc'),
    otherwise: (schema) => schema.optional(),
  }),
  license: yup.string().when('role', {
    is: 'doctor',
    then: (schema) => schema.required('Giấy phép hành nghề là bắt buộc'),
    otherwise: (schema) => schema.optional(),
  }),
  specialty: yup.string().when('role', {
    is: 'doctor',
    then: (schema) => schema.required('Chuyên khoa là bắt buộc'),
    otherwise: (schema) => schema.optional(),
  }),
});


export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const role = watch('role');

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await authAPI.register(data);
      const { user, token } = response.data;

      login(user, token);
      toast.success(t('registerSuccess'));
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: 'patient', label: t('patient'), description: 'Tôi cần được hỗ trợ y tế' },
    { value: 'doctor', label: t('doctor'), description: 'Tôi muốn làm tình nguyện viên' },
    { value: 'charity_admin', label: t('charity_admin'), description: 'Tôi đại diện tổ chức từ thiện' },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="healthcare-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="healthcare-heading text-2xl font-bold">
              {t('register')}
            </CardTitle>
            <CardDescription className="healthcare-subtitle">
              Tạo tài khoản MedicalHope+ mới
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* STEP 1 */}
              {step === 1 && (
                <>
                  {/* Họ và tên */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t("fullName")}</Label>
                    <Input
                      id="fullName"
                      placeholder="Nguyễn Văn A"
                      {...register("fullName")}
                      className={errors.fullName ? "border-destructive" : ""}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      {...register("email")}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("phone")}</Label>
                    <Input
                      id="phone"
                      placeholder="0123456789"
                      {...register("phone")}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label htmlFor="role">{t("role")}</Label>
                    <Select value={role} onValueChange={(value) => setValue("role", value)}>
                      <SelectTrigger
                        className={errors.role ? "border-destructive" : ""}
                      >
                        <SelectValue placeholder="Chọn vai trò của bạn" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {option.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role && (
                      <p className="text-sm text-destructive">{errors.role.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("password")}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...register("password")}
                        className={
                          errors.password
                            ? "border-destructive pr-10"
                            : "pr-10"
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...register("confirmPassword")}
                        className={
                          errors.confirmPassword
                            ? "border-destructive pr-10"
                            : "pr-10"
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Nút điều hướng */}
                  <div className="col-span-1 md:col-span-2">
                    {role === "doctor" ? (
                      <Button
                        type="button"
                        className="w-full btn-healthcare"
                        onClick={() => setStep(2)}
                      >
                        Tiếp tục
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="w-full btn-healthcare"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loading size="sm" className="mr-2" />
                        ) : (
                          <UserPlus className="mr-2 h-4 w-4" />
                        )}
                        {t("register")}
                      </Button>
                    )}
                  </div>
                </>
              )}

              {/* STEP 2 - chỉ hiện nếu role = doctor */}
              {step === 2 && role === "doctor" && (
                <>
                  {/* Kinh nghiệm */}
                  <div className="space-y-2">
                    <Label htmlFor="experience">Kinh nghiệm</Label>
                    <Input
                      id="experience"
                      placeholder="5 năm kinh nghiệm"
                      {...register("experience")}
                      className={errors.experience ? "border-destructive" : ""}
                    />
                    {errors.experience && (
                      <p className="text-sm text-destructive">{errors.experience.message}</p>
                    )}
                  </div>

                  {/* Giấy phép hành nghề */}
                  <div className="space-y-2">
                    <Label htmlFor="license">Giấy phép hành nghề</Label>
                    <Input
                      id="license"
                      placeholder="Số giấy phép"
                      {...register("license")}
                      className={errors.license ? "border-destructive" : ""}
                    />
                    {errors.license && (
                      <p className="text-sm text-destructive">{errors.license.message}</p>
                    )}
                  </div>

                  {/* Chuyên khoa */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="specialty">Chuyên khoa</Label>
                    <Input
                      id="specialty"
                      placeholder="Nội tổng quát, Tim mạch..."
                      {...register("specialty")}
                      className={errors.specialty ? "border-destructive" : ""}
                    />
                    {errors.specialty && (
                      <p className="text-sm text-destructive">{errors.specialty.message}</p>
                    )}
                  </div>

                  {/* Nút điều hướng */}
                  <div className="col-span-1 md:col-span-2 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setStep(1);
                      }}
                    >
                      Quay lại
                    </Button>
                    <Button
                      type="submit"
                      className="btn-healthcare"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loading size="sm" className="mr-2" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      {t("register")}
                    </Button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Đã có tài khoản? </span>
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                {t('login')}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            ← Quay lại trang chủ
          </Link>
        </div>
      </motion.div>
    </div>
  );
}