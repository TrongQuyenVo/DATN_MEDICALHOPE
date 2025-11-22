/* eslint-disable @typescript-eslint/no-explicit-any */
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  Stethoscope,
  Gift,
  HandHeart,
  Building2,
  BarChart3,
  Settings,
  Home,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import Logo from '@/assets/logomedical.jpg';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const location = useLocation();

  if (!user) return null;

  const getNavigationItems = () => {
    const commonItems = [
      { path: '/dashboard', icon: Home, label: t('dashboard') },
      { path: '/profile', icon: Settings, label: t('profile') },
    ];

    const roleSpecificItems: Record<string, any[]> = {
      patient: [
        { path: '/appointments', icon: Calendar, label: t('appointments') },
        { path: '/doctors', icon: Stethoscope, label: t('doctors') },
        { path: '/assistance', icon: HandHeart, label: 'Yêu cầu hỗ trợ' },
      ],
      doctor: [
        { path: '/appointments', icon: Calendar, label: t('appointments') },
        { path: '/patients', icon: Users, label: t('patients') },
        { path: '/availability', icon: Clock, label: 'Lịch rảnh' },
      ],
      admin: [
        { path: '/users', icon: Users, label: 'Người dùng' },
        { path: '/appointments', icon: Calendar, label: t('appointments') },
        { path: '/donations', icon: Gift, label: t('donations') },
        { path: '/assistance', icon: HandHeart, label: t('assistance') },
        { path: '/partners', icon: Building2, label: 'Quản lý đối tác' },
        { path: '/packages', icon: Gift, label: 'Quản lý gói khám miễn phí' },
        { path: '/events', icon: Calendar, label: 'Quản lý sự kiện & hoạt động' },
        { path: '/testimonials', icon: HandHeart, label: 'Quản lý đánh giá' },
        { path: '/analytics', icon: BarChart3, label: 'Thống kê' },
      ],
      charity_admin: [
        { path: '/patients', icon: Users, label: t('patients') },
        { path: '/donations', icon: Gift, label: t('donations') },
        { path: '/assistance', icon: HandHeart, label: t('assistance') },
        { path: '/partners', icon: Building2, label: 'Quản lý đối tác' },
      ],
    };

    return [...commonItems, ...(roleSpecificItems[user.role] || [])];
  };

  const navigationItems = getNavigationItems();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <motion.aside
      initial={{ width: isCollapsed ? 80 : 280 }}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className={cn('border-r bg-sidebar flex flex-col h-screen', className)}
    >
      {/* Header - chỉ có logo + tên (không còn nút toggle ở đây) */}
      <div className="flex h-16 items-center px-6 border-b gap-3">
        <div className="h-9 w-9 rounded-sm overflow-hidden shadow-md border border-border bg-white flex-shrink-0">
          <img src={Logo} alt="MedicalHope+" className="h-full w-full object-contain" />
        </div>
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -10 : 0 }}
          transition={{ duration: 0.3 }}
          className="whitespace-nowrap healthcare-heading text-lg font-bold text-sidebar-foreground"
        >
          MedicalHope+
        </motion.span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive: navActive }) =>
              cn(
                'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive(item.path)
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground'
              )
            }
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -10 : 0 }}
              transition={{ duration: 0.3 }}
              className="ml-3 whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          </NavLink>
        ))}
      </nav>

      {/* Footer: Role + Nút Thu gọn/Mở rộng (Chevron) */}
      <div className="px-4 pb-5 bg-sidebar/95">
        <div className="flex items-center justify-between gap-3">
          {/* Role Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-w-0"
          >
            <div className="healthcare-card p-3 rounded-lg text-center border">
              <div className="text-xs text-muted-foreground">Vai trò</div>
              <div className="text-sm font-semibold capitalize text-primary truncate">
                {t(user.role.replace('_', ' '))}
              </div>
            </div>
          </motion.div>

          {/* Nút Chevron < > - ĐẸP & MƯỢT */}
          <motion.button
            onClick={toggleCollapsed}
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-300",
              "hover:bg-sidebar-foreground/20 hover:shadow-md",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            )}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 text-sidebar-foreground" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-sidebar-foreground" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
}