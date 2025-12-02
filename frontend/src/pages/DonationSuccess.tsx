// pages/DonationSuccess.tsx
import Footer from "@/components/layout/Footer";
import NavHeader from "@/components/layout/NavHeader";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { Heart } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import ChatBubble from "./ChatbotPage";

export default function DonationSuccess() {
  const [searchParams] = useSearchParams();
  const txnRef = searchParams.get("txnRef") || "Đang xử lý...";

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-6">
        <NavHeader />
        <div className="bg-white rounded-3xl shadow-2xl px-12 text-center max-w-md">
          <Heart className="w-24 h-24 text-red-500 fill-red-500 mx-auto mt-4 mb-6 animate-pulse" />
          <h1 className="text-4xl font-bold text-green-600 mb-4">
            QUYÊN GÓP THÀNH CÔNG!
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Cảm ơn trái tim ấm áp của bạn
          </p>

          <div className="bg-gray-100 rounded-2xl p-6 mb-8">
            <p className="text-sm text-gray-600 mb-2">Mã giao dịch của bạn</p>
            <p className="text-2xl font-mono font-bold text-indigo-600">{txnRef}</p>
          </div>

          <p className="text-sm text-gray-500 mb-8">
            Thanh toán qua <strong>PayPal / Thẻ quốc tế</strong>
          </p>

          <Link
            to="/"
            className="inline-block px-8 py-4 mb-4 bg-gradient-to-r from-green-600 to-teal-600 text-white text-lg font-bold rounded-xl hover:shadow-xl transition"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
      <Footer />
      <ScrollToTop />
      <ChatBubble />
    </>
  );
}