import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl shadow-md bg-card border"
      >
        <CheckCircle2 className="text-green-500 w-20 h-20" />
        <h2 className="text-2xl font-semibold text-green-600">
          Thanh toán thành công!
        </h2>
        <p className="text-gray-500">
          Cảm ơn bạn đã thanh toán. Giao dịch của bạn đã được xác nhận.
        </p>
        <Button onClick={() => navigate("/")} className="mt-3">
          Về trang chủ
        </Button>
      </motion.div>
    </div>
  );
}
