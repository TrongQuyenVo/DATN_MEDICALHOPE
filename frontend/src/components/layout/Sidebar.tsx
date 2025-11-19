import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Heart,
  Users,
  Stethoscope,
  Gift,
  HandHeart,
  Building2,
  BarChart3,
  Settings,
  Menu,
  X,
  Home,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const location = useLocation();

  if (!user) return null;

  // Navigation items based on user role, excluding chatbot
  const getNavigationItems = () => {
    const commonItems = [
      { path: '/dashboard', icon: Home, label: t('dashboard') },
      { path: '/profile', icon: Settings, label: t('profile') },
    ];

    const roleSpecificItems = {
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
        { path: '/testimonials', icon: Heart, label: 'Quản lý đánh giá' },
        { path: '/analytics', icon: BarChart3, label: 'Thống kê' },
      ],
      charity_admin: [
        { path: '/patients', icon: Heart, label: t('patients') },
        { path: '/donations', icon: Gift, label: t('donations') },
        { path: '/assistance', icon: HandHeart, label: t('assistance') },
        { path: '/partners', icon: Building2, label: 'Quản lý đối tác' }, 
      ],
    };

    return [...commonItems, ...roleSpecificItems[user.role]];
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
      className={cn(
        'border-r bg-sidebar flex flex-col h-screen',
        className
      )}
    >
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b relative">
        <div className="flex items-center overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isCollapsed ? 0 : 1, scale: isCollapsed ? 0.8 : 1 }}
            transition={{ duration: 0.3 }}
            className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center"
          >
            <Heart className="h-4 w-4 text-white" />
          </motion.div>

          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -10 : 0 }}
            transition={{ duration: 0.3 }}
            className="ml-2 whitespace-nowrap healthcare-heading text-lg font-bold"
          >
            MedicalHope+
          </motion.span>
        </div>

        {/* Toggle Button */}
        <motion.button
          onClick={toggleCollapsed}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-sidebar-foreground/20 transition-all duration-300",
            isCollapsed ? "left-1/2 -translate-x-1/2" : "right-4"
          )}
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5 text-sidebar-foreground" />
          ) : (
            <X className="h-5 w-5 text-sidebar-foreground" />
          )}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive: navActive }) =>
              cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive(item.path)
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
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

      {/* User Role Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isCollapsed ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="px-4 pb-4"
      >
        <div className="healthcare-card p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Vai trò hiện tại</div>
          <div className="text-sm font-medium capitalize text-primary">
            {t(user.role)}
          </div>
        </div>
      </motion.div>
    </motion.aside>
  );
}