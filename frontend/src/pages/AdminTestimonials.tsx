import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Eye, EyeOff, Heart, Info } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import ChatBubble from "./ChatbotPage";
import { useAuthStore } from "@/stores/authStore";

interface Testimonial {
  _id?: string;
  name: string;
  age: string;
  location: string;
  content: string;
  treatment: string;
  visible?: boolean;
  likes?: number;
}

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [selected, setSelected] = useState<Testimonial | null>(null);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';


  // 🟢 Lấy danh sách
  const fetchTestimonials = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_REACT_API_URL_BACKEND}/api/testimonials`
      );
      setTestimonials(res.data);
    } catch {
      toast.error("Không thể tải danh sách đánh giá");
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // 🔴 Xóa
  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này không?")) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_REACT_API_URL_BACKEND}/api/testimonials/${id}`
      );
      toast.success("Đã xóa đánh giá");
      fetchTestimonials();
    } catch {
      toast.error("Lỗi khi xóa đánh giá");
    }
  };

  // 🟠 Ẩn/Hiện
  const toggleVisibility = async (id?: string, currentVisible?: boolean) => {
    if (!id) return;
    try {
      await axios.put(
        `${import.meta.env.VITE_REACT_API_URL_BACKEND}/api/testimonials/${id}/visibility`,
        { visible: !currentVisible }
      );
      toast.success(
        !currentVisible ? "Đánh giá đã được hiển thị" : "Đánh giá đã được ẩn"
      );
      fetchTestimonials();
    } catch {
      toast.error("Không thể cập nhật trạng thái hiển thị");
    }
  };

  return (
    <>
      {/* ✅ Phần chính */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h1 className="healthcare-heading text-3xl font-bold">
            Quản lý lời yêu thương
          </h1>
        </div>

        <Card className="healthcare-card overflow-x-auto">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">Họ tên</TableHead>
                  <TableHead className="w-[50px] text-center">Tuổi</TableHead>
                  <TableHead className="w-[100px]">Địa chỉ</TableHead>
                  <TableHead className="w-[100px]">Dịch vụ</TableHead>
                  <TableHead className="w-[150px]">Nội dung</TableHead>
                  <TableHead className="w-[50px] text-center">Tim</TableHead>
                  <TableHead className="w-[100px] text-center">
                    Trạng thái
                  </TableHead>
                  <TableHead className="w-[140px] text-center">
                    Hành động
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {testimonials.length > 0 ? (
                  testimonials.map((t) => (
                    <TableRow key={t._id}>
                      <TableCell>{t.name}</TableCell>
                      <TableCell className="text-center">{t.age}</TableCell>
                      <TableCell>{t.location}</TableCell>
                      <TableCell>
                        <p
                          className="truncate max-w-[140px] cursor-pointer hover:text-primary transition"
                          title={t.treatment}
                        >
                          {t.treatment}
                        </p>
                      </TableCell>

                      {/* Nội dung rút gọn */}
                      <TableCell>
                        <p
                          className="line-clamp-2 text-sm text-muted-foreground cursor-pointer hover:text-primary transition"
                          onClick={() => setSelected(t)}
                          title={t.content}
                        >
                          {t.content}
                        </p>
                      </TableCell>

                      {/* Tim */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-red-500">
                          <Heart className="h-4 w-4 fill-red-500" />
                          <span>{t.likes || 0}</span>
                        </div>
                      </TableCell>

                      {/* Trạng thái */}
                      <TableCell className="text-center">
                        {t.visible ? (
                          <span className="text-green-600 font-medium">
                            Hiển thị
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">Ẩn</span>
                        )}
                      </TableCell>

                      {/* Hành động */}
                      <TableCell className="text-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelected(t)}
                          title="Xem chi tiết"
                        >
                          <Info className="h-4 w-4 text-blue-600" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleVisibility(t._id, t.visible)}
                          title={t.visible ? "Ẩn" : "Hiện"}
                        >
                          {t.visible ? (
                            <EyeOff className="h-4 w-4 text-gray-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-green-600" />
                          )}
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(t._id)}
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-6"
                    >
                      Chưa có đánh giá nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {!isAdmin && <ChatBubble />}
      </motion.div>

      {/* ✅ Modal xem chi tiết */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold mb-3">{selected.name}</h2>
            <p className="text-sm text-gray-600 mb-2">
              {selected.age} tuổi • {selected.location}
            </p>
            <p className="text-sm text-primary mb-3 font-medium">
              Dịch vụ: {selected.treatment}
            </p>
            <p className="text-gray-800 whitespace-pre-line">
              {selected.content}
            </p>

            <div className="flex justify-end mt-5 space-x-3">
              <Button variant="outline" onClick={() => setSelected(null)}>
                Đóng
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  toggleVisibility(selected._id, selected.visible);
                  setSelected(null);
                }}
              >
                {selected.visible ? (
                  <EyeOff className="mr-2 h-4 w-4 text-gray-600" />
                ) : (
                  <Eye className="mr-2 h-4 w-4 text-green-600" />
                )}
                {selected.visible ? "Ẩn" : "Hiện"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDelete(selected._id);
                  setSelected(null);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Xóa
              </Button>
            </div>
          </motion.div>
        </div>

      )}
    </>
  );
}
