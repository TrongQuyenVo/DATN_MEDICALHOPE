import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";
import { doctorsAPI, appointmentsAPI } from "@/lib/api";

const schema = yup.object({
  doctorId: yup.string().required("Vui lòng chọn bác sĩ"),
  slotId: yup.string().required("Vui lòng chọn khung giờ rảnh"),
  appointmentType: yup.string().required("Vui lòng chọn loại lịch hẹn"),
  patientNotes: yup.string().optional(),
});

export default function BookAppointmentForm({ open, onOpenChange, doctor, onSuccess }) {
  const { user, isAuthenticated, token } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [doctors, setDoctors] = useState(doctor ? [doctor] : []);
  const [error, setError] = useState(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(!doctor);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      doctorId: doctor?._id || "",
      appointmentType: "consultation",
    },
  });

  const selectedDoctorId = watch("doctorId");

  // Load danh sách bác sĩ
  useEffect(() => {
    const fetchDoctors = async () => {
      if (doctor) return;
      if (!isAuthenticated || !token) {
        toast.error("Vui lòng đăng nhập để tiếp tục.");
        return;
      }

      setIsLoadingDoctors(true);
      try {
        const response = await doctorsAPI.getAll();
        const doctorsData = Array.isArray(response.data.doctors)
          ? response.data.doctors
          : [];
        setDoctors(doctorsData);
        if (doctorsData.length === 0) toast("Không có bác sĩ khả dụng.");
      } catch (err) {
        console.error("Lỗi tải danh sách bác sĩ:", err);
        toast.error("Lỗi khi tải danh sách bác sĩ.");
      } finally {
        setIsLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, [isAuthenticated, token, doctor]);

  // Khi chọn bác sĩ → tự load lịch rảnh
  useEffect(() => {
    if (!selectedDoctorId) return;
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const response = await doctorsAPI.getAvailability(selectedDoctorId);
        setAvailableSlots(response.data.availableSlots || []);
      } catch (error) {
        console.error("Lỗi tải khung giờ rảnh:", error);
        toast.error("Lỗi khi tải khung giờ rảnh.");
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDoctorId]);

  // Đặt lịch
  const onSubmit = async (data) => {
    if (!isAuthenticated || !token) {
      toast.error("Vui lòng đăng nhập để tiếp tục.");
      return;
    }

    const selectedSlot = availableSlots.find((s) =>
      s.times.some((t) => `${s.date}-${t}` === data.slotId)
    );

    if (!selectedSlot) {
      toast.error("Vui lòng chọn khung giờ hợp lệ.");
      return;
    }

    const [year, month, day, slotTime] = data.slotId.split("-");
    const slotDate = `${year}-${month}-${day}`;

    setIsSubmitting(true);
    try {
      const requestData = {
        doctorId: data.doctorId,
        date: slotDate,
        time: slotTime,
        appointmentType: data.appointmentType,
        patientNotes: data.patientNotes || "",
      };
      console.log("📤 Sending appointment request:", requestData);
      await appointmentsAPI.create(requestData);
      toast.success("Đặt lịch hẹn thành công!");
      reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("❌ Error when creating appointment:", err);
      console.error("🧩 Response data:", err.response?.data);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi đặt lịch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="healthcare-heading">
            Đặt lịch hẹn khám
          </DialogTitle>
          <DialogDescription>
            Chọn bác sĩ và khung giờ rảnh phù hợp
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Bác sĩ */}
          <div className="space-y-2">
            <Label>Bác sĩ *</Label>
            <Select onValueChange={(value) => setValue("doctorId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn bác sĩ" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingDoctors ? (
                  <SelectItem value="loading" disabled>
                    Đang tải danh sách bác sĩ...
                  </SelectItem>
                ) : doctors.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    Không có bác sĩ khả dụng
                  </SelectItem>
                ) : (
                  doctors.map((doc) => (
                    <SelectItem
                      key={doc._id || doc.id}
                      value={doc._id || doc.id}
                    >
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        {doc.userId?.fullName || doc.name} -{" "}
                        {doc.specialty || "Không xác định"}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.doctorId && (
              <p className="text-sm text-destructive">
                {errors.doctorId.message}
              </p>
            )}
          </div>

          {/* Khung giờ rảnh */}
          <div className="space-y-3">
            <Label>Chọn khung giờ rảnh *</Label>
            {isLoadingSlots ? (
              <p className="text-sm text-muted-foreground">
                Đang tải khung giờ rảnh...
              </p>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Không có khung giờ rảnh khả dụng.
              </p>
            ) : (
              Object.entries(
                availableSlots.reduce(
                  (acc: Record<string, any[]>, slot: any) => {
                    const date = format(new Date(slot.date), "dd/MM/yyyy");
                    acc[date] = acc[date] || [];
                    acc[date].push(slot);
                    return acc;
                  },
                  {}
                )
              ).map(([date, slots]) => (
                <div key={date} className="border p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{date}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slots.flatMap((slot: any) =>
                      slot.times.map((time: string, idx: number) => (
                        <Badge
                          key={`${slot.date}-${time}-${idx}`}
                          onClick={() =>
                            setValue("slotId", `${slot.date}-${time}`)
                          }
                          className={`cursor-pointer px-3 py-1 rounded-lg text-sm ${watch("slotId") === `${slot.date}-${time}`
                            ? "bg-primary text-white"
                            : "bg-muted text-black hover:bg-primary/10"
                            }`}
                        >
                          {time}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
            {errors.slotId && (
              <p className="text-sm text-destructive">
                {errors.slotId.message}
              </p>
            )}
          </div>

          {/* Loại lịch hẹn */}
          <div className="space-y-2">
            <Label>Loại lịch hẹn *</Label>
            <Select
              onValueChange={(value) => setValue("appointmentType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại lịch hẹn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">Tư vấn</SelectItem>
                <SelectItem value="follow_up">Tái khám</SelectItem>
                <SelectItem value="emergency">Khẩn cấp</SelectItem>
                <SelectItem value="telehealth">Khám từ xa</SelectItem>
              </SelectContent>
            </Select>
            {errors.appointmentType && (
              <p className="text-sm text-destructive">
                {errors.appointmentType.message}
              </p>
            )}
          </div>

          {/* Ghi chú */}
          <div className="space-y-2">
            <Label htmlFor="patientNotes">Ghi chú thêm</Label>
            <Textarea
              id="patientNotes"
              placeholder="Thông tin bổ sung..."
              rows={3}
              {...register("patientNotes")}
            />
          </div>

          {/* Nút hành động */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="btn-healthcare"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang đặt lịch..." : "Đặt lịch hẹn"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}