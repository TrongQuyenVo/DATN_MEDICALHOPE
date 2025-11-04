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

interface Campaign {
  id: string;
  title: string;
  description: string;
  target: number;
  raised: number;
  image?: string;
}

interface DonationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign;
}

interface FormData {
  amount: number;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  message?: string;
  paymentMethod: string;
}

const schema = yup.object({
  amount: yup
    .number()
    .required("Vui lòng nhập số tiền quyên góp")
    .min(10000, "Số tiền tối thiểu là 10,000 VNĐ"),

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
  campaign,
}: DonationFormProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    context: { isAnonymous },
  });

  const watchedAmount = watch("amount");

  // Tự động điền thông tin người dùng khi form mở và không chọn ẩn danh
  useEffect(() => {
    if (open && user && !isAnonymous) {
      setValue("donorName", user.fullName || "");
      setValue("donorEmail", user.email || "");
      setValue("donorPhone", user.phone || "");
    }
  }, [open, user, isAnonymous, setValue]);

  // Xóa thông tin khi chọn ẩn danh
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
    }
  }, [open, reset]);

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

  const paymentMethods = [{ value: "vnpay", label: "VNPay", icon: "💳" }];

  const handleQuickAmount = (amount: number) => {
    setSelectedAmount(amount);
    setValue("amount", amount);
  };

  const onSubmit = async (data: any) => {
    const { vnp_TmnCode, vnp_HashSecret, vnp_Url, BASE_URL } = ENV;
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
      vnp_Amount: watchedAmount * 100,
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

    const sortedParams = sortObject(paymentData)
      .map((key) => `${key}=${encodeURIComponent(paymentData[key])}`)
      .join("&");

    const vnp_SecureHash = calculateVnpSecureHash(sortedParams, vnp_HashSecret);
    const paymentUrl = `${vnp_Url}?${sortedParams}&vnp_SecureHash=${vnp_SecureHash}`;
    alert(`Thanh toán qua VNPay với số tiền: ${watchedAmount} VND`);
    console.log({ paymentUrl });
    window.location.href = paymentUrl;
  };

  const progress = campaign ? (campaign.raised / campaign.target) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="healthcare-heading flex items-center">
            <Heart className="mr-2 h-6 w-6 text-red-500" />
            Quyên góp từ thiện
          </DialogTitle>
          <DialogDescription>
            Mỗi đóng góp của bạn đều mang lại hy vọng cho những người cần giúp đỡ
          </DialogDescription>
        </DialogHeader>

        {campaign && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold healthcare-heading">{campaign.title}</h3>
            <p className="text-muted-foreground text-sm">{campaign.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Đã quyên góp:</span>
                <span className="font-medium">
                  {campaign.raised.toLocaleString("vi-VN")} /{" "}
                  {campaign.target.toLocaleString("vi-VN")} VNĐ
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {progress.toFixed(1)}% hoàn thành mục tiêu
              </p>
            </div>
          </div>
        )}

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
                placeholder="Nhập số tiền bạn muốn quyên góp"
                {...register("amount")}
                onChange={(e) => {
                  setSelectedAmount(null);
                  setValue("amount", Number(e.target.value));
                }}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {watchedAmount && (
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  Số tiền quyên góp: {Number(watchedAmount).toLocaleString("vi-VN")} VNĐ
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
                  onCheckedChange={(checked) => setIsAnonymous(checked === true)}
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
                  <p className="text-sm text-destructive">{errors.donorName.message}</p>
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
                    <p className="text-sm text-destructive">{errors.donorEmail.message}</p>
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
                    <p className="text-sm text-destructive">{errors.donorPhone.message}</p>
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
              placeholder="Để lại lời động viên..."
              rows={3}
              {...register("message")}
            />
          </div>

          {/* Phương thức thanh toán */}
          <div className="space-y-2">
            <Label>Phương thức thanh toán *</Label>
            <Select onValueChange={(value) => setValue("paymentMethod", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn phương thức thanh toán" />
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
              <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>
            )}
          </div>

          {/* Chỉ hiển thị cho VNPAY */}
          {watch("paymentMethod") === "vnpay" && (
            <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg space-y-3 mt-3">
              <h4 className="font-semibold text-purple-800 dark:text-purple-200">
                Thanh toán điện tử VNPay
              </h4>
              <p>
                Bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất giao dịch.
              </p>
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang xử lý..." : "Thanh toán qua VNPay"}
              </Button>
            </div>
          )}

          {/* Thông tin minh bạch */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Cam kết minh bạch
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• 100% số tiền được chuyển đến người cần hỗ trợ</li>
                  <li>• Bảo mật thông tin cá nhân tuyệt đối</li>
                  <li>• Có thể xuất hóa đơn từ thiện để giảm trừ thuế</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}