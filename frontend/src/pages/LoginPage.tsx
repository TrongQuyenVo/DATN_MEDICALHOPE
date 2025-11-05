/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Heart, LogIn, Users } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';

import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const schema = yup.object({
    email: yup.string().email(t('invalidEmail', 'Invalid email')).required(t('emailRequired', 'Email is required')),
    password: yup.string().required(t('passwordRequired', 'Password is required')),
  });

  // Check for demo parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const demoRole = urlParams.get('demo');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
  });


  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Gọi API thật
      const response = await authAPI.login(data);
      const { user, token } = response.data;

      login(user, token);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success(t('loginSuccess', 'Đăng nhập thành công'));
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t('loginError', 'Đăng nhập thất bại')
      );
    } finally {
      setIsLoading(false);
    }
  };

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
              {t('login')}
            </CardTitle>
            <CardDescription className="healthcare-subtitle">
              Đăng nhập vào tài khoản MedicalHope+ của bạn
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full btn-healthcare"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loading size="sm" className="mr-2" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                {t('login')}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Chưa có tài khoản? </span>
              <Link
                to="/register"
                className="text-primary hover:underline font-medium"
              >
                {t('register')}
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