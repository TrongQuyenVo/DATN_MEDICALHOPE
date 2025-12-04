import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore'; // Thêm dòng này

export default function ScrollToTop() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { user } = useAuthStore(); // Lấy user để check role
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300); // Tăng lên 300 để mượt hơn
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {showScrollTop && (
        <Button
          size="icon"
          className={`fixed w-14 h-14 rounded-full bg-gradient-primary text-white shadow-lg hover:bg-primary/90 transition-all duration-300 z-50
            right-4 
            ${isAdmin ? 'bottom-2' : 'bottom-20'} 
          `}
          onClick={scrollToTop}
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
      )}
    </>
  );
}