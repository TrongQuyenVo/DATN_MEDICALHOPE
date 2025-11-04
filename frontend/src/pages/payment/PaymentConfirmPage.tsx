/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import queryString from "query-string";
import { ENV } from "@/config/ENV";
import { calculateVnpSecureHash } from "@/utils/calculateVnpSecureHash";
import { sortObject } from "@/utils/sortObject";

// Định nghĩa kiểu cho các tham số query
interface VnpParams {
  [key: string]: string | undefined;
}

const PaymentConfirmPage: React.FC = () => {
  const location = useLocation();
  const queries = queryString.parse(location.search) as VnpParams;
  const vnp_HashSecret = ENV.vnp_HashSecret || "";
  const navigate = useNavigate();

  const verifyPayment = async () => {
    const { vnp_SecureHash, ...vnp_Params } = queries;
    const sortedParams = sortObject(vnp_Params)
      .map(
        (key: string) =>
          `${key}=${encodeURIComponent(vnp_Params[key] as string)}`
      )
      .join("&");
    const signed = calculateVnpSecureHash(sortedParams, vnp_HashSecret);
    if (vnp_SecureHash === signed) {
      const { vnp_TransactionStatus } = vnp_Params;
      if (vnp_TransactionStatus === "00") {
        navigate("/payment-success");
      } else {
        navigate("/payment-failed");
      }
    } else {
      navigate("/payment-invalid");
    }
  };

  useEffect(() => {
    if (queries.vnp_SecureHash) {
      verifyPayment();
    }
  }, []);

  return (
    <div className="flex mobile:flex-col w-full h-screen bg-white p-5">
      <div className="flex mobile:w-full w-6/12 mx-auto justify-center items-center ">
        <div className="w-[400px]">
          <video
            className="object-cover"
            src="https://cdnl.iconscout.com/lottie/premium/thumb/payment-received-8453779-6725893.mp4"
            autoPlay
            loop
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmPage;
