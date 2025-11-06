// components/donations/DonationForm.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Heart, CreditCard, User, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import toast from "react-hot-toast";
import { ENV } from "@/config/ENV";
import { sortObject } from "@/utils/sortObject";
import { calculateVnpSecureHash } from "@/utils/calculateVnpSecureHash";
import { useAuthStore } from "@/stores/authStore";
import { assistanceAPI, donationsAPI } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";

interface PatientAssistance {
  _id: string;
  title: string;
  description: string;
  requestedAmount: number;
  raisedAmount: number;
  medicalCondition: string;
  urgency: string;
  patientId: {
    userId: {
      fullName: string;
      phone: string;
      profile: { address?: string };
    };
  };
}

interface DonationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistanceId?: string;
}

interface FormData {
  amount: number;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  message: string;
  paymentMethod: string;
}

const schema = yup.object({
  amount: yup
    .number()
    .required("Vui lòng nhập số tiền quyên góp")
    .min(10000, "Số tiền tối thiểu là 10,000 VNĐ")
    .test("max", "Số tiền vượt quá số còn thiếu", function (value) {
      const { assistance } = this.parent;
      if (!assistance || !value) return true;
      return value <= assistance.requestedAmount - assistance.raisedAmount;
    }),

  donorName: yup.string().when("$isAnonymous", {
    is: false,
    then: (schema) => schema.required("Vui lòng nhập họ tên"),
    otherwise: (schema) => schema.optional(),
  }),

  donorEmail: yup.string().when("$isAnonymous", {
    is: false,
    then: (schema) =>
      schema.email("Email không hợp lệ").required("Vui lòng nhập email"),
    otherwise: (schema) => schema.optional(),
  }),

  donorPhone: yup.string().when("$isAnonymous", {
    is: false,
    then: (schema) => schema.required("Vui lòng nhập số điện thoại"),
    otherwise: (schema) => schema.optional(),
  }),

  message: yup.string(),
  paymentMethod: yup.string().required("Vui lòng chọn phương thức thanh toán"),
});

export default function DonationForm({
  open,
  onOpenChange,
  assistanceId,
}: DonationFormProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [assistance, setAssistance] = useState<PatientAssistance | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    context: { isAnonymous, assistance },
  });

  const watchedAmount = watch("amount");

  // === LẤY THÔNG TIN YÊU CẦU HỖ TRỢ ===
  useEffect(() => {
    if (open && assistanceId) {
      const fetchAssistance = async () => {
        setLoading(true);
        try {
          const res = await assistanceAPI.getById(assistanceId);
          setAssistance(res.data.data);
        } catch (error: any) {
          toast.error(
            error.response?.data?.message || "Không thể tải thông tin yêu cầu"
          );
          onOpenChange(false);
        } finally {
          setLoading(false);
        }
      };
      fetchAssistance();
    } else {
      setAssistance(null);
    }
  }, [open, assistanceId, onOpenChange]);

  // === TỰ ĐỘNG ĐIỀN THÔNG TIN ===
  useEffect(() => {
    if (open && user && !isAnonymous) {
      setValue("donorName", user.fullName || "");
      setValue("donorEmail", user.email || "");
      setValue("donorPhone", user.phone || "");
    }
  }, [open, user, isAnonymous, setValue]);

  useEffect(() => {
    if (isAnonymous) {
      setValue("donorName", "");
      setValue("donorEmail", "");
      setValue("donorPhone", "");
    }
  }, [isAnonymous, setValue]);

  useEffect(() => {
    if (!open) {
      reset();
      setIsAnonymous(false);
      setSelectedAmount(null);
      setAssistance(null);
    }
  }, [open, reset]);

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  const paymentMethods = [{ value: "vnpay", label: "VNPay", icon: "Card" }];

  const handleQuickAmount = (amount: number) => {
    setSelectedAmount(amount);
    setValue("amount", amount);
  };
  const { setPaymentInfo } = useAppStore();
  const onSubmit = async (data: FormData) => {
    console.log("BƯỚC 1: Form được submit", data);

    if (!assistance) {
      console.error("Không có thông tin assistance");
      toast.error("Không có thông tin yêu cầu hỗ trợ");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("BƯỚC 2: Gọi API tạo donation...", {
        assistanceId: assistance._id,
        amount: data.amount,
        isAnonymous,
        paymentMethod: data.paymentMethod,
      });

      // === TẠO DONATION TRƯỚC ===
      const donationRes = await donationsAPI.create({
        assistanceId: assistance._id,
        amount: data.amount,
        donorName: isAnonymous ? null : data.donorName,
        donorEmail: isAnonymous ? null : data.donorEmail,
        donorPhone: isAnonymous ? null : data.donorPhone,
        message: data.message || null,
        isAnonymous,
        paymentMethod: data.paymentMethod,
      });

      console.log("BƯỚC 3: Tạo donation thành công", donationRes.data);

      if (data.paymentMethod === "vnpay") {
        const { vnp_TmnCode, vnp_HashSecret, vnp_Url, BASE_URL } = ENV;
        const donationId = donationRes.data.donation._id;
        setPaymentInfo({
          donationId,
          amount: data.amount,
          method: data.paymentMethod,
          status: "pending",
        });
        const returnUrl = `${BASE_URL}/xac-nhan-thanh-toan`;
        if (!vnp_HashSecret || !vnp_Url || !vnp_TmnCode || !returnUrl) {
          alert("Không thể thực hiện thanh toán, thiếu thông tin cấu hình.");
          return;
        }

        const createDate = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/[-:T]/g, "");
        const orderId =
          new Date().getHours().toString().padStart(2, "0") +
          new Date().getMinutes().toString().padStart(2, "0") +
          Math.floor(Math.random() * 10000);

        const paymentData: any = {
          vnp_Amount: data.amount * 100,
          vnp_Command: "pay",
          vnp_CreateDate: createDate,
          vnp_CurrCode: "VND",
          vnp_IpAddr: "127.0.0.1",
          vnp_Locale: "vn",
          vnp_OrderInfo: "p",
          vnp_OrderType: "250000",
          vnp_ReturnUrl: returnUrl,
          vnp_TxnRef: orderId,
          vnp_Version: "2.1.0",
          vnp_TmnCode: vnp_TmnCode,
        };

        console.log("BƯỚC 5: Dữ liệu gửi VNPay (trước sort)", paymentData);

        const sortedParams = Object.keys(paymentData)
          .sort((a, b) => a.localeCompare(b))
          .filter((key) => paymentData[key] != null && paymentData[key] !== "")
          .map((key) => `${key}=${encodeURIComponent(paymentData[key])}`)
          .join("&");

        const vnp_SecureHash = calculateVnpSecureHash(
          sortedParams,
          vnp_HashSecret
        );
        const paymentUrl = `${vnp_Url}?${sortedParams}&vnp_SecureHash=${vnp_SecureHash}`;
        alert(`Thanh toán qua VNPay với số tiền: ${data.amount} VND`);
        window.location.href = paymentUrl;
        // const { vnp_TmnCode, vnp_HashSecret, vnp_Url, BASE_URL } = ENV;

        // console.log("BƯỚC 4: Kiểm tra cấu hình VNPay", {
        //   vnp_TmnCode: vnp_TmnCode ? "OK" : "MISSING",
        //   vnp_HashSecret: vnp_HashSecret ? "OK" : "MISSING",
        //   vnp_Url: vnp_Url || "MISSING",
        //   BASE_URL,
        // });

        // if (!vnp_HashSecret || !vnp_Url || !vnp_TmnCode) {
        //   console.error("Cấu hình VNPay thiếu");
        //   toast.error("Cấu hình VNPay chưa đầy đủ");
        //   return;
        // }

        // const donationId = donationRes.data.donation._id;
        // const returnUrl = `${BASE_URL}/donation-result?donationId=${donationId}`;

        // const createDate = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "");
        // const orderId = `DON${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // const paymentData: any = {
        //   vnp_Amount: data.amount * 100,
        //   vnp_Command: "pay",
        //   vnp_CreateDate: createDate,
        //   vnp_CurrCode: "VND",
        //   vnp_IpAddr: "127.0.0.1",
        //   vnp_Locale: "vn",
        //   vnp_OrderInfo: `Quyen gop cho ${assistance.title}`,
        //   vnp_OrderType: "250001",
        //   vnp_ReturnUrl: returnUrl,
        //   vnp_TxnRef: orderId,
        //   vnp_Version: "2.1.0",
        //   vnp_TmnCode,
        // };

        // console.log("BƯỚC 5: Dữ liệu gửi VNPay (trước sort)", paymentData);

        // const sortedParams = Object.keys(paymentData)
        //   .sort((a, b) => a.localeCompare(b))
        //   .filter((key) => paymentData[key] != null && paymentData[key] !== "")
        //   .map((key) => `${key}=${encodeURIComponent(paymentData[key])}`)
        //   .join("&");

        // console.log("BƯỚC 6: Params đã sort & encode", sortedParams);

        // const vnp_SecureHash = calculateVnpSecureHash(sortedParams, vnp_HashSecret);
        // console.log("BƯỚC 7: SecureHash", vnp_SecureHash);

        // const finalUrl = `${vnp_Url}?${sortedParams}&vnp_SecureHash=${vnp_SecureHash}`;
        // console.log("BƯỚC 8: URL thanh toán đầy đủ", finalUrl);

        // // TẠO FORM ĐỘNG
        // const form = document.createElement("form");
        // form.method = "POST";
        // form.action = vnp_Url;
        // form.target = "_blank";

        // const params = new URLSearchParams(sortedParams);
        // params.append("vnp_SecureHash", vnp_SecureHash);

        // console.log("BƯỚC 9: Các input trong form", Object.fromEntries(params));

        // for (const [key, value] of params.entries()) {
        //   const input = document.createElement("input");
        //   input.type = "hidden";
        //   input.name = key;
        //   input.value = value;
        //   form.appendChild(input);
        // }

        // document.body.appendChild(form);
        // console.log("BƯỚC 10: Form đã thêm vào DOM và submit...");
        // form.submit();
        // document.body.removeChild(form);

        // toast.success("Đang chuyển đến cổng thanh toán...");
        // onOpenChange(false);
      } else {
        toast.success("Quyên góp thành công!");
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("LỖI TOÀN BỘ", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(error.response?.data?.message || "Lỗi khi quyên góp");
    } finally {
      setIsSubmitting(false);
      console.log("BƯỚC CUỐI: Kết thúc submit");
    }
  };

  const progress = assistance
    ? (assistance.raisedAmount / assistance.requestedAmount) * 100
    : 0;

  const remaining = assistance
    ? assistance.requestedAmount - assistance.raisedAmount
    : 0;

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="text-center py-8">Đang tải thông tin...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!assistance) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="healthcare-heading flex items-center">
            <Heart className="mr-2 h-6 w-6 text-red-500" />
            Hỗ trợ bệnh nhân
          </DialogTitle>
          <DialogDescription>
            Đóng góp của bạn giúp {assistance.patientId.userId.fullName} vượt
            qua khó khăn
          </DialogDescription>
        </DialogHeader>

        {/* THÔNG TIN YÊU CẦU HỖ TRỢ */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <h3 className="font-semibold healthcare-heading">
            {assistance.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            <strong>Bệnh:</strong> {assistance.medicalCondition} •{" "}
            <strong>Độ khẩn:</strong> {assistance.urgency}
          </p>
          <p className="text-sm">{assistance.description}</p>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Đã quyên góp:</span>
              <span className="font-medium">
                {assistance.raisedAmount.toLocaleString("vi-VN")} /{" "}
                {assistance.requestedAmount.toLocaleString("vi-VN")} VNĐ
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progress.toFixed(1)}% • Còn thiếu:{" "}
              {remaining.toLocaleString("vi-VN")} VNĐ
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Số tiền */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold healthcare-heading">
                Số tiền quyên góp
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant={selectedAmount === amount ? "default" : "outline"}
                  className="text-sm"
                  onClick={() => handleQuickAmount(amount)}
                  disabled={amount > remaining}
                >
                  {amount.toLocaleString("vi-VN")} VNĐ
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền khác (VNĐ) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder={`Tối đa ${remaining.toLocaleString("vi-VN")}`}
                {...register("amount")}
                onChange={(e) => {
                  setSelectedAmount(null);
                  setValue("amount", Number(e.target.value));
                }}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>

            {watchedAmount && (
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  Số tiền quyên góp:{" "}
                  {Number(watchedAmount).toLocaleString("vi-VN")} VNĐ
                </p>
              </div>
            )}
          </div>

          {/* Thông tin người quyên góp */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold healthcare-heading">
                  Thông tin người quyên góp
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) =>
                    setIsAnonymous(checked === true)
                  }
                />
                <Label htmlFor="anonymous" className="text-sm">
                  Quyên góp ẩn danh
                </Label>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="donorName">Họ và tên *</Label>
                <Input
                  id="donorName"
                  placeholder="Nhập họ tên đầy đủ"
                  disabled={isAnonymous}
                  {...register("donorName")}
                />
                {errors.donorName && (
                  <p className="text-sm text-destructive">
                    {errors.donorName.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="donorEmail">Email *</Label>
                  <Input
                    id="donorEmail"
                    type="email"
                    placeholder="email@example.com"
                    disabled={isAnonymous}
                    {...register("donorEmail")}
                  />
                  {errors.donorEmail && (
                    <p className="text-sm text-destructive">
                      {errors.donorEmail.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="donorPhone">Số điện thoại *</Label>
                  <Input
                    id="donorPhone"
                    type="tel"
                    placeholder="0987654321"
                    disabled={isAnonymous}
                    {...register("donorPhone")}
                  />
                  {errors.donorPhone && (
                    <p className="text-sm text-destructive">
                      {errors.donorPhone.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lời nhắn */}
          <div className="space-y-2">
            <Label htmlFor="message">Lời nhắn (tùy chọn)</Label>
            <Textarea
              id="message"
              placeholder="Chúc bệnh nhân mau khỏe..."
              rows={3}
              {...register("message")}
            />
          </div>

          {/* Phương thức thanh toán */}
          <div className="space-y-2">
            <Label>Phương thức thanh toán *</Label>
            <Select onValueChange={(value) => setValue("paymentMethod", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn phương thức" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center">
                      <span className="mr-2">{method.icon}</span>
                      {method.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentMethod && (
              <p className="text-sm text-destructive">
                {errors.paymentMethod.message}
              </p>
            )}
          </div>

          {/* VNPAY */}
          {watch("paymentMethod") === "vnpay" && (
            <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg space-y-3 mt-3">
              <h4 className="font-semibold text-purple-800 dark:text-purple-200">
                Thanh toán qua VNPay
              </h4>
              <p className="text-sm">
                Bạn sẽ được chuyển đến cổng thanh toán an toàn.
              </p>
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang xử lý..." : "Thanh toán ngay"}
              </Button>
            </div>
          )}

          {/* Cam kết minh bạch */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Cam kết minh bạch
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• 100% số tiền đến tay bệnh nhân</li>
                  <li>• Bảo mật thông tin tuyệt đối</li>
                  <li>• Có hóa đơn từ thiện hợp pháp</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
