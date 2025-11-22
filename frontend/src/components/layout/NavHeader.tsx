import { useState, useEffect } from 'react';
import { Globe, Moon, Sun } from 'lucide-react'; // Heart đã bị loại bỏ
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/appStore';
import Logo from '@/assets/logomedical.jpg'; // Logo đã import

export default function NavHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { theme, setTheme, language, setLanguage } = useAppStore();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    const newLang = language === 'vi' ? 'en' : 'vi';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const navigateWithScroll = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(path);
  };

  const navLinks = [
    { path: '/', label: 'Trang chủ' },
    { path: '/about', label: 'Về chúng tôi' },
    { path: '/services', label: 'Dịch vụ' },
    { path: '/programs', label: 'Chương trình' },
    { path: '/organizations', label: 'Tổ chức' },
    { path: '/login', label: 'Đăng nhập' },
    { path: '/register', label: 'Đăng ký' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* === PHẦN LOGO ĐÃ THAY ĐỔI === */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigateWithScroll('/')}
          >
            <div className="h-12 w-12 rounded-sm overflow-hidden shadow-lg flex items-center justify-center bg-white">
              <img
                src={Logo}
                alt="MedicalHope+ Logo"
                className="h-full w-full object-contain" // hoặc object-cover nếu muốn fill đầy
              />
            </div>
            <div>
              <span className="healthcare-heading text-xl font-bold">MedicalHope+</span>
              <p className="text-xs text-muted-foreground">Y tế từ thiện</p>
            </div>
          </div>
          {/* === KẾT THÚC PHẦN LOGO === */}

          <div className="hidden md:flex items-center space-x-6">
            {navLinks.slice(0, 5).map((link) => (
              <Button
                key={link.path}
                variant="ghost"
                size="sm"
                onClick={() => navigateWithScroll(link.path)}
                className={`${location.pathname === link.path
                  ? 'btn-healthcare text-white hover:bg-orange-600'
                  : ''
                  } transition-colors duration-200`}
              >
                {link.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            <Button
              onClick={() => navigateWithScroll('/login')}
              className={`btn-healthcare ${location.pathname === '/login' ? 'bg-orange-500 text-white hover:bg-orange-600' : ''
                } transition-colors duration-200`}
            >
              Đăng nhập
            </Button>
            <Button
              onClick={() => navigateWithScroll('/register')}
              className={`btn-healthcare ${location.pathname === '/register' ? 'bg-orange-500 text-white hover:bg-orange-600' : ''
                } transition-colors duration-200`}
            >
              Đăng ký
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}