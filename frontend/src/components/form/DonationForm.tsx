// components/donations/DonationForm.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Heart, CreditCard, User, Shield, Loader2 } from "lucide-react";
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
import { calculateVnpSecureHash } from "@/utils/calculateVnpSecureHash";
import { useAuthStore } from "@/stores/authStore";
import { assistanceAPI } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";
import VNpay from "@/assets/vnpay-logo.png";

interface PatientAssistance {
  _id: string;
  title: string;
  description: string;
  requestedAmount: number;
  raisedAmount: number;
  medicalCondition: string;
  urgency: string;
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

export default function DonationForm({ open, onOpenChange, assistanceId }: DonationFormProps) {
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

  // === GIỮ NGUYÊN LOGIC CŨ 100% ===
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

  // === GIỮ NGUYÊN TOÀN BỘ LOGIC SUBMIT + VNPAY ===
  const onSubmit = async (data: FormData) => {
    if (!assistance) return;

    setIsSubmitting(true);

    try {
      const { vnp_TmnCode, vnp_HashSecret, vnp_Url, BASE_URL } = ENV;
      if (!vnp_HashSecret || !vnp_Url || !vnp_TmnCode) {
        toast.error("Cấu hình thanh toán bị thiếu");
        return;
      }

      // Tạo orderId ngẫu nhiên hoặc timestamp + random
      const orderId = Date.now().toString() + Math.floor(Math.random() * 1000);

      // Lưu tạm thông tin vào localStorage hoặc context để dùng khi callback
      const tempPaymentData = {
        assistanceId: assistance._id,
        amount: data.amount,
        isAnonymous: isAnonymous,
        donorName: isAnonymous ? null : data.donorName?.trim() || null,
        donorEmail: isAnonymous ? null : data.donorEmail?.trim() || null,
        donorPhone: isAnonymous ? null : data.donorPhone?.trim() || null,
        message: data.message?.trim() || null,
        orderId,
        createdAt: new Date().toISOString(),
      };

      // Lưu tạm vào localStorage (vì sau redirect sẽ mất state)
      localStorage.setItem("pending_payment", JSON.stringify(tempPaymentData));

      // Tạo URL thanh toán
      const createDate = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
      const returnUrl = `${BASE_URL}/xac-nhan-thanh-toan`;

      const paymentData: any = {
        vnp_Amount: data.amount * 100,
        vnp_Command: "pay",
        vnp_CreateDate: createDate,
        vnp_CurrCode: "VND",
        vnp_IpAddr: "127.0.0.1",
        vnp_Locale: "vn",
        vnp_OrderInfo: `Quyen gop cho benh nhan - ${assistance.title}`,
        vnp_OrderType: "250000",
        vnp_ReturnUrl: returnUrl,
        vnp_TxnRef: orderId, // quan trọng: dùng orderId này để đối chiếu
        vnp_Version: "2.1.0",
        vnp_TmnCode: vnp_TmnCode,
      };

      const sortedParams = Object.keys(paymentData)
        .sort((a, b) => a.localeCompare(b))
        .map(key => `${key}=${encodeURIComponent(paymentData[key])}`)
        .join("&");

      const vnp_SecureHash = calculateVnpSecureHash(sortedParams, vnp_HashSecret);
      const paymentUrl = `${vnp_Url}?${sortedParams}&vnp_SecureHash=${vnp_SecureHash}`;

      // Chuyển hướng
      window.location.href = paymentUrl;

    } catch (error) {
      console.error("Lỗi tạo URL thanh toán:", error);
      toast.error("Không thể chuyển đến cổng thanh toán");
    } finally {
      setIsSubmitting(false);
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
        <DialogContent className="sm:max-w-2xl">
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">Đang tải thông tin...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!assistance) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50/50 to-pink-50/30">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-3 text-primary">
            <Heart className="h-9 w-9 text-red-500 fill-red-500 animate-pulse" />
            Hỗ trợ bệnh nhân
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Mỗi đóng góp của bạn là một tia hy vọng cho người bệnh
          </DialogDescription>
        </DialogHeader>

        {/* Card thông tin bệnh nhân - đẹp hơn */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 -mt-3">
          <h3 className="text-xl font-bold text-primary">{assistance.title}</h3>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
            <span className="font-medium">{assistance.medicalCondition}</span>
            <span>•</span>
            <span className="font-medium text-orange-600">{assistance.urgency}</span>
          </div>
          <p className="text-muted-foreground mt-3 leading-relaxed">{assistance.description}</p>

          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-lg font-semibold">
              <span>Đã quyên góp</span>
              <span className="text-primary">
                {assistance.raisedAmount.toLocaleString("vi-VN")}đ / {assistance.requestedAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>
            <Progress value={progress} className="h-4 rounded-full" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{progress.toFixed(1)}% hoàn thành</span>
              <span className="font-medium text-red-600">
                Còn thiếu: {remaining.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7 mt-6">

          {/* Số tiền - đẹp hơn */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">Số tiền quyên góp</h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant={selectedAmount === amount ? "default" : "outline"}
                  className="h-12 text-base font-medium"
                  onClick={() => handleQuickAmount(amount)}
                  disabled={amount > remaining}
                >
                  {amount.toLocaleString("vi-VN")}đ
                </Button>
              ))}
            </div>

            <div>
              <Input
                type="number"
                placeholder={`Nhập số tiền khác (tối đa ${remaining.toLocaleString("vi-VN")}đ)`}
                className="text-lg font-medium"
                {...register("amount")}
                onChange={(e) => {
                  setSelectedAmount(null);
                  setValue("amount", Number(e.target.value));
                }}
              />
              {errors.amount && (
                <p className="text-sm text-destructive mt-2">{errors.amount.message}</p>
              )}
            </div>

            {watchedAmount && (
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl border border-emerald-200">
                <p className="text-emerald-800 font-bold text-xl">
                  Bạn đang ủng hộ: {Number(watchedAmount).toLocaleString("vi-VN")} VNĐ
                </p>
                <p className="text-emerald-700 mt-1">Trái tim bạn thật ấm áp ❤️</p>
              </div>
            )}
          </div>

          {/* Thông tin người ủng hộ */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold">Thông tin người quyên góp</h3>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                />
                <Label htmlFor="anonymous" className="font-medium cursor-pointer">
                  Quyên góp ẩn danh
                </Label>
              </div>
            </div>

            {!isAnonymous && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Họ và tên *</Label>
                  <Input {...register("donorName")} placeholder="Nguyễn Văn A" />
                  {errors.donorName && <p className="text-sm text-destructive">{errors.donorName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Số điện thoại *</Label>
                  <Input {...register("donorPhone")} placeholder="0901234567" />
                  {errors.donorPhone && <p className="text-sm text-destructive">{errors.donorPhone.message}</p>}
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Email *</Label>
                  <Input {...register("donorEmail")} type="email" placeholder="email@example.com" />
                  {errors.donorEmail && <p className="text-sm text-destructive">{errors.donorEmail.message}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Lời nhắn */}
          <div className="space-y-3">
            <Label>Lời nhắn (tùy chọn)</Label>
            <Textarea
              {...register("message")}
              placeholder="Chúc bệnh nhân mau khỏe lại..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Phương thức thanh toán - giữ nguyên logic cũ */}
          <div className="space-y-3">
            <Label>Phương thức thanh toán *</Label>
            <Select onValueChange={(value) => setValue("paymentMethod", value)}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Chọn phương thức thanh toán" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center gap-3">
                      <img src={VNpay} alt="VNPay" className="h-6 w-6" />
                      <span className="font-medium">{method.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentMethod && (
              <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>
            )}
          </div>

          {/* Nút thanh toán nổi bật */}
          {watch("paymentMethod") === "vnpay" && (
            <Button
              type="submit"
              size="lg"
              className="w-full h-16 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Đang chuyển đến cổng thanh toán...
                </>
              ) : (
                <>
                  <img src={VNpay} alt="VNPay" className="h-8 mr-3" />
                  Thanh toán an toàn ngay
                </>
              )}
            </Button>
          )}

          {/* Cam kết minh bạch */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 text-center">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <p className="text-lg font-bold text-blue-900">Cam kết minh bạch tuyệt đối</p>
            <ul className="text-sm text-blue-800 mt-3 space-y-1">
              <li>• 100% số tiền đến tay bệnh nhân</li>
              <li>• Bảo mật thông tin người ủng hộ</li>
              <li>• Cung cấp hóa đơn từ thiện hợp pháp</li>
            </ul>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}