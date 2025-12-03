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
  Menu, // Thêm icon menu cho mobile
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import Logo from '@/assets/logomedical.jpg';

// shadcn/ui components
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const location = useLocation();

  // Mobile drawer state
  const [open, setOpen] = useState(false);

  // Detect screen size
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);

      // Khi chuyển sang desktop → tự động đóng drawer mobile
      if (desktop) {
        setOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      // charity_admin: [
      //   { path: '/patients', icon: Users, label: t('patients') },
      //   { path: '/donations', icon: Gift, label: t('donations') },
      //   { path: '/assistance', icon: HandHeart, label: t('assistance') },
      // ],
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

  // Nội dung Sidebar (dùng chung cho cả desktop và mobile)
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6 gap-4">
          <div className="h-9 w-9 rounded-sm overflow-hidden shadow-md border border-border bg-white flex-shrink-0">
            <img src={Logo} alt="MedicalHope+" className="h-full w-full object-contain" />
          </div>
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isDesktop && isCollapsed ? 0 : 1, x: isDesktop && isCollapsed ? -10 : 0 }}
            transition={{ duration: 0.3 }}
            className="whitespace-nowrap healthcare-heading text-lg font-bold text-sidebar-foreground"
          >
            MedicalHope+
          </motion.span>
        </div>
      </header>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => !isDesktop && setOpen(false)} // Đóng drawer khi click link trên mobile
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
            <item.icon className="h-5 w-5 shrink-0" />
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isDesktop && isCollapsed ? 0 : 1, x: isDesktop && isCollapsed ? -10 : 0 }}
              transition={{ duration: 0.3 }}
              className="ml-3 whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          </NavLink>
        ))}
      </nav>

      {/* Footer: Role + Toggle Button (chỉ hiện trên desktop) */}
      {isDesktop && (
        <div className="px-4 pb-5 bg-sidebar/95">
          <div className="flex items-center justify-between gap-3">
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

            <motion.button
              onClick={toggleCollapsed}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-300",
                "hover:bg-sidebar-foreground/20 hover:shadow-md"
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
      )}
    </div>
  );

  // Desktop: Sidebar cố định
  if (isDesktop) {
    return (
      <motion.aside
        initial={{ width: isCollapsed ? 80 : 280 }}
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className={cn('border-r bg-sidebar flex flex-col h-screen hidden lg:flex', className)}
      >
        <SidebarContent />
      </motion.aside>
    );
  }

  // Mobile & Tablet: Overlay Drawer
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-4 z-50 lg:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Mở menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="p-0 w-80 bg-sidebar border-r-0">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}