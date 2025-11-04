import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PaymentInvalid() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center space-y-4"
      >
        <AlertTriangle className="text-yellow-500 w-20 h-20" />
        <h2 className="text-2xl font-semibold text-yellow-600">
          Xác thực thanh toán thất bại
        </h2>
        <p className="text-gray-500">
          Có lỗi khi xác thực giao dịch. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.
        </p>
        <Button onClick={() => navigate("/")} variant="outline">
          Về trang chủ
        </Button>
      </motion.div>
    </div>
  );
}
