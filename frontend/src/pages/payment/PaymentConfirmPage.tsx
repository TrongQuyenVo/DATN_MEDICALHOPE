import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import queryString from "query-string";
import toast from "react-hot-toast";
import { donationsAPI } from "@/lib/api";

const PaymentConfirmPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queries = queryString.parse(location.search);

  useEffect(() => {
    const pendingData = localStorage.getItem("pending_payment");
    if (!pendingData) {
      toast.error("Không tìm thấy thông tin thanh toán");
      navigate("/");
      return;
    }

    const paymentData = JSON.parse(pendingData);

    // Kiểm tra kết quả từ VNPay
    if (queries.vnp_TransactionStatus === "00" && queries.vnp_ResponseCode === "00") {
      // Thanh toán thành công → xác nhận ở backend bằng txnRef
      const txnRef = (queries.vnp_TxnRef as string) || paymentData.vnp_TxnRef || paymentData.txnRef;
      if (!txnRef) {
        toast.error("Không tìm thấy mã giao dịch");
        localStorage.removeItem("pending_payment");
        navigate("/payment-failed");
        return;
      }

      donationsAPI
        .confirmSuccess(txnRef)
        .then(() => {
          toast.success("Quyên góp thành công! Cảm ơn tấm lòng của bạn ❤️");
          localStorage.removeItem("pending_payment");
          navigate("/payment-success");
        })
        .catch((err) => {
          toast.error("Lưu thông tin quyên góp thất bại, vui lòng liên hệ admin");
          console.error(err);
        });
    } else {
      toast.error("Thanh toán không thành công hoặc đã bị hủy");
      localStorage.removeItem("pending_payment");
      navigate("/payment-failed");
    }
  }, [queries, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-pink-50">
      <div className="text-center">
        <video
          className="w-64 mx-auto"
          src="https://cdnl.iconscout.com/lottie/premium/thumb/payment-processing-8453781-6725895.mp4"
          autoPlay
          loop
          muted
        />
        <p className="text-2xl font-bold text-gray-800 mt-8">Đang xử lý thanh toán...</p>
        <p className="text-gray-600">Vui lòng đợi một chút nhé</p>
      </div>
    </div>
  );
};

export default PaymentConfirmPage;