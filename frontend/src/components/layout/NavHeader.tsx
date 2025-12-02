import { useState } from 'react';
import { Globe, Moon, Sun, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/appStore';
import Logo from '@/assets/logomedical.jpg';

// shadcn/ui Sheet
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function NavHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { theme, setTheme, language, setLanguage } = useAppStore();
  const [open, setOpen] = useState(false);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const toggleLanguage = () => {
    const newLang = language === 'vi' ? 'en' : 'vi';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const navigateWithScroll = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(path);
    setOpen(false); // Đóng menu mobile khi chuyển trang
  };

  const navLinks = [
    { path: '/', label: 'Trang chủ' },
    { path: '/about', label: 'Về chúng tôi' },
    { path: '/services', label: 'Dịch vụ' },
    { path: '/programs', label: 'Chương trình' },
    { path: '/organizations', label: 'Tổ chức' },
  ];

  function cn(...classes: string[]): string {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          {/* ===== LOGO ===== */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => navigateWithScroll('/')}
          >
            <div className="h-12 w-12 rounded-sm overflow-hidden shadow-lg flex items-center justify-center bg-white">
              <img src={Logo} alt="MedicalHope+ Logo" className="h-full w-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <span className="healthcare-heading text-xl font-bold block">MedicalHope+</span>
              <p className="text-xs text-muted-foreground -mt-1">Y tế từ thiện</p>
            </div>
          </div>

          {/* ===== MENU DESKTOP ===== */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Button
                key={link.path}
                variant="ghost"
                size="sm"
                onClick={() => navigateWithScroll(link.path)}
                className={cn(
                  "font-medium transition-all",
                  location.pathname === link.path
                    ? "btn-healthcare text-white hover:bg-orange-600"
                    : ""
                )}
              >
                {link.label}
              </Button>
            ))}
          </div>

          {/* ===== ACTION BUTTONS DESKTOP ===== */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            <Button
              onClick={() => navigateWithScroll('/login')}
              className="btn-healthcare"
            >
              Đăng nhập
            </Button>

            <Button
              onClick={() => navigateWithScroll('/register')}
              className="btn-healthcare"
            >
              Đăng ký
            </Button>
          </div>

          {/* ===== MOBILE MENU TRIGGER ===== */}
          <div className="flex items-center gap-2 md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-80 sm:w-96 p-0">
                <SheetHeader className="p-6 border-b">
                  <SheetTitle className="text-left text-2xl healthcare-heading">
                    MedicalHope+
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-full">
                  <nav className="flex-1 px-6 py-6 space-y-3">
                    {navLinks.map((link) => (
                      <Button
                        key={link.path}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-lg font-medium h-12",
                          location.pathname === link.path
                            ? "btn-healthcare"
                            : ""
                        )}
                        onClick={() => navigateWithScroll(link.path)}
                      >
                        {link.label}
                      </Button>
                    ))}

                    <div className="pt-6 space-y-4 border-t mt-6">
                      <Button
                        onClick={() => navigateWithScroll('/login')}
                        className="w-full btn-healthcare h-12 text-lg"
                      >
                        Đăng nhập
                      </Button>

                      <Button
                        onClick={() => navigateWithScroll('/register')}
                        className="w-full btn-healthcare h-12 text-lg"
                      >
                        Đăng ký
                      </Button>
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}