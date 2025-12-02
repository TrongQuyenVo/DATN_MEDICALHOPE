import { Link, XCircle } from "lucide-react";

// pages/DonationFailure.tsx
export default function DonationFailure() {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
        <XCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-red-600 mb-4">Thanh toán thất bại</h1>
        <p className="text-lg text-gray-700">Vui lòng thử lại sau ít phút</p>
        <Link to="/" className="inline-block mt-8 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition">
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}