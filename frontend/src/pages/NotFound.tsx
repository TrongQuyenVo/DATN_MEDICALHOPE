import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center text-white"
      >
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
          <Heart className="h-12 w-12" />
        </div>
        
        <h1 className="mb-4 text-6xl font-bold">404</h1>
        <h2 className="mb-4 text-2xl font-semibold">Trang không tìm thấy</h2>
        <p className="mb-8 text-lg text-white/80 max-w-md mx-auto">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển đến địa chỉ khác.
        </p>
        
        <div className="space-y-4">
          <Button
            asChild
            size="lg"
            className="bg-white text-primary hover:bg-white/90"
          >
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              Về trang chủ
            </Link>
          </Button>
          
          <div>
            <Button
              asChild
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <button onClick={() => window.history.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại trang trước
              </button>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
