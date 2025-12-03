/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  Video,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import BookAppointmentForm from "@/components/form/BookAppointmentForm";
import { appointmentsAPI } from "@/lib/api";

export default function AppointmentsPage() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    page: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentsAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
      });

      const appointmentsData = Array.isArray(response.data.appointments)
        ? response.data.appointments
        : [];

      setAppointments(appointmentsData);
      setPagination(
        response.data.pagination || { total: 0, pages: 1, page: 1, limit: 10 }
      );
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Không thể tải danh sách lịch hẹn";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [pagination.page, pagination.limit]);

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      await appointmentsAPI.updateStatus(appointmentId, {
        status: "confirmed",
      });
      setAppointments((prev) =>
        prev.map((apt) =>
          apt._id === appointmentId ? { ...apt, status: "confirmed" } : apt
        )
      );
      toast.success("Đã xác nhận lịch hẹn");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể xác nhận lịch hẹn"
      );
    }
  };

  const handleRejectAppointment = async (appointmentId: string) => {
    try {
      await appointmentsAPI.updateStatus(appointmentId, {
        status: "cancelled",
      });
      setAppointments((prev) =>
        prev.map((apt) =>
          apt._id === appointmentId ? { ...apt, status: "cancelled" } : apt
        )
      );
      toast.success("Đã từ chối lịch hẹn");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể từ chối lịch hẹn"
      );
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await appointmentsAPI.updateStatus(appointmentId, {
        status: "cancelled",
      });
      setAppointments((prev) =>
        prev.map((apt) =>
          apt._id === appointmentId ? { ...apt, status: "cancelled" } : apt
        )
      );
      toast.success("Bạn đã hủy lịch hẹn thành công");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể hủy lịch hẹn");
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const getPageTitle = () => {
    switch (user?.role) {
      case "patient":
        return "Lịch hẹn của tôi";
      case "doctor":
        return "Lịch khám bệnh";
      default:
        return "Quản lý lịch hẹn";
    }
  };

  const isAppointmentExpired = (scheduledTime: string) => {
    return new Date(scheduledTime) < new Date();
  };

  // HÀM HIỂN THỊ LOẠI KHÁM BẰNG TIẾNG VIỆT + ICON ĐẸP
  const renderAppointmentType = (type: string) => {
    switch (type) {
      case "consultation":
        return (
          <div className="flex items-center gap-2 text-blue-700 font-medium">
            <Stethoscope className="h-4 w-4" /> Khám lần đầu
          </div>
        );
      case "follow_up":
        return (
          <div className="flex items-center gap-2 text-green-700 font-medium">
            <Calendar className="h-4 w-4" /> Tái khám
          </div>
        );
      case "emergency":
        return (
          <div className="flex items-center gap-2 text-red-700 font-medium">
            <AlertCircle className="h-4 w-4" /> Khám khẩn cấp
          </div>
        );
      case "telehealth":
        return (
          <div className="flex items-center gap-2 text-purple-700 font-medium">
            <Video className="h-4 w-4" /> Khám online
          </div>
        );
      default:
        return <span className="text-muted-foreground">{type}</span>;
    }
  };

  // HÀM HIỂN THỊ TRẠNG THÁI ĐẸP + MÀU CHUẨN
  const renderStatusBadge = (status: string) => {
    const statusConfig: Record<string, { text: string; className: string }> = {
      confirmed: {
        text: "Đã xác nhận",
        className: "bg-green-100 text-green-800 border-green-200",
      },
      scheduled: {
        text: "Đã đặt lịch",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      },
      pending: {
        text: "Chờ xác nhận",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      in_progress: {
        text: "Đang khám",
        className: "bg-purple-100 text-purple-800 border-purple-200",
      },
      completed: {
        text: "Hoàn thành",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200",
      },
      cancelled: {
        text: "Đã hủy",
        className: "bg-red-100 text-red-800 border-red-200",
      },
      no_show: {
        text: "Không đến",
        className: "bg-gray-100 text-gray-700 border-gray-300",
      },
    };

    const config = statusConfig[status] || {
      text: status,
      className: "bg-gray-100 text-gray-700",
    };
    return (
      <Badge className={`${config.className} font-medium`}>{config.text}</Badge>
    );
  };

  if (!user) return null;

  if (error) {
    return (
      <Card className="healthcare-card">
        <CardHeader>
          <CardTitle className="healthcare-heading">Có lỗi xảy ra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="healthcare-heading text-3xl font-bold">
            {getPageTitle()}
          </h1>
          <p className="healthcare-subtitle">
            Quản lý và theo dõi các lịch hẹn khám bệnh
          </p>
        </div>
        {user.role === "patient" && (
          <Button
            className="btn-healthcare"
            onClick={() => setOpenDialog(true)}
          >
            <Calendar className="mr-2 h-4 w-4" /> Đặt lịch mới
          </Button>
        )}
      </div>

      <Card className="healthcare-card">
        <CardHeader>
          <CardTitle className="text-2xl">Danh sách lịch hẹn</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Đang tải dữ liệu...</div>
          ) : appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="flex items-center justify-between p-5 border rounded-xl hover:bg-muted/50 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="h-7 w-7 text-white" />
                    </div>

                    <div className="space-y-2">
                      {/* Tên bác sĩ / bệnh nhân */}
                      {user.role === "doctor" ? (
                        <div className="font-semibold text-lg flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          {appointment.patientId?.userId?.fullName ||
                            "Không xác định"}
                        </div>
                      ) : (
                        <div className="font-semibold text-lg">
                          BS.{" "}
                          {appointment.doctorId?.userId?.fullName ||
                            "Chưa phân công"}
                        </div>
                      )}

                      {/* Loại khám */}
                      {renderAppointmentType(appointment.appointmentType)}

                      {/* Thời gian */}
                      <div className="text-sm text-muted-foreground">
                        {new Date(appointment.scheduledTime).toLocaleString(
                          "vi-VN",
                          {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>

                      {/* Hiển thị tên bệnh nhân cho admin */}
                      {(user.role === "admin") && (
                        <div className="text-sm text-muted-foreground">
                          Bệnh nhân:{" "}
                          {appointment.patientId?.userId?.fullName ||
                            "Không xác định"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Trạng thái */}
                    {renderStatusBadge(appointment.status)}

                    {/* Nút hành động */}
                    {!isAppointmentExpired(appointment.scheduledTime) && (
                      <>
                        {/* Bác sĩ */}
                        {user.role === "doctor" &&
                          appointment.status === "scheduled" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleConfirmAppointment(appointment._id)
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-1" /> Xác
                                nhận
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-600 text-red-600 hover:bg-red-50"
                                onClick={() =>
                                  handleRejectAppointment(appointment._id)
                                }
                              >
                                <XCircle className="h-4 w-4 mr-1" /> Từ chối
                              </Button>
                            </div>
                          )}

                        {/* Bệnh nhân */}
                        {user.role === "patient" &&
                          appointment.status === "scheduled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-600 hover:bg-red-50"
                              onClick={() =>
                                handleCancelAppointment(appointment._id)
                              }
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Hủy lịch
                            </Button>
                          )}

                        {/* Admin */}
                        {(user.role === "admin") &&
                          ["scheduled", "pending"].includes(
                            appointment.status
                          ) && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleConfirmAppointment(appointment._id)
                                }
                              >
                                Xác nhận
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleRejectAppointment(appointment._id)
                                }
                              >
                                Hủy
                              </Button>
                            </div>
                          )}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Trước
                </Button>
                <span className="text-sm font-medium">
                  Trang {pagination.page} / {pagination.pages || 1}
                </span>
                <Button
                  variant="outline"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Tiếp
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground text-lg">
              {user.role === "patient"
                ? "Bạn chưa có lịch hẹn nào"
                : "Hiện chưa có lịch hẹn nào trong hệ thống"}
            </div>
          )}
        </CardContent>
      </Card>

      {openDialog && (
        <BookAppointmentForm
          open={openDialog}
          onOpenChange={setOpenDialog}
          doctor={null}
          onSuccess={fetchAppointments}
        />
      )}
    </motion.div>
  );
}
