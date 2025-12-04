/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, MessageCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/authStore";
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import {
  analyticsAPI,
  registrationsAPI,
  assistanceAPI,
  donationsAPI,
} from "@/lib/api"; // Đảm bảo import đúng đường dẫn

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
}

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();

  const getChatStorageKey = () => {
    return user?.id ? `chatMessages_${user.id}` : "chatMessages_guest";
  };

  // ==================== LỜI CHÀO RIÊNG CHO ADMIN ====================
  const [messages, setMessages] = useState<Message[]>(() => {
    const key = getChatStorageKey();
    const savedMessages = localStorage.getItem(key);

    if (savedMessages) {
      return JSON.parse(savedMessages, (key, value) => {
        if (key === "timestamp") return new Date(value);
        return value;
      });
    }

    if (user?.role === "admin") {
      return [
        {
          id: "1",
          type: "bot" as const,
          content: `Chào **Quản trị viên ${user.fullName}**\n\n` +
            "Bạn đang ở **chế độ quản trị hệ thống**.\n\n" +
            "• Gõ **/help** → Xem tất cả lệnh quản trị\n" +
            "• Gõ **/thongke** → Xem thống kê realtime\n\n" +
            "Hoặc trò chuyện bình thường với trợ lý AI.",
          timestamp: new Date(),
        },
      ];
    }

    return [
      {
        id: "1",
        type: "bot" as const,
        content: `Xin chào ${user?.fullName || "bạn"}! Tôi là trợ lý ảo của MedicalHope+. Tôi có thể giúp bạn về:\n\n` +
          "• Tìm hiểu về dịch vụ y tế miễn phí\n" +
          "• Đặt lịch khám bệnh\n" +
          "• Thông tin về bác sĩ tình nguyện\n" +
          "• Quyên góp và hỗ trợ y tế\n" +
          "• Hướng dẫn sử dụng hệ thống\n" +
          "• Hoặc bất kỳ câu hỏi nào khác!\n\n" +
          "Bạn cần hỗ trợ gì hôm nay?",
        timestamp: new Date(),
      },
    ];
  });

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Gemini AI setup
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  const [availableModel, setAvailableModel] = useState<string>("gemini-1.5-pro");

  useEffect(() => {
    const listAvailableModels = async () => {
      if (!genAI || !apiKey) return;
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await response.json();
        const models = data.models || [];
        const preferredModel =
          models.find((m: any) => m.name.includes("gemini-1.5-pro")) ||
          models.find((m: any) => m.name.includes("gemini-pro"));
        setAvailableModel(preferredModel ? preferredModel.name.split("/").pop() : "gemini-pro");
      } catch (error) {
        console.error("Lỗi khi liệt kê mô hình:", error);
      }
    };
    listAvailableModels();
  }, [genAI, apiKey]);

  // Xóa chat cũ khi đổi user
  useEffect(() => {
    const lastUserId = localStorage.getItem("lastChatUserId");
    if (lastUserId && lastUserId !== user?.id && lastUserId !== "guest") {
      localStorage.removeItem(`chatMessages_${lastUserId}`);
    }
    localStorage.setItem("lastChatUserId", user?.id || "guest");
  }, [user]);

  // Save messages
  useEffect(() => {
    const key = getChatStorageKey();
    localStorage.setItem(key, JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // ==================== ADMIN COMMANDS (GỌI API THẬT) ====================
  const ADMIN_COMMANDS: Record<string, { description: string; handler: () => Promise<string | null> }> = {
    "/help": {
      description: "Hiển thị danh sách lệnh",
      handler: async () => `
        **Danh sách lệnh quản trị**

        /help → Xem danh sách lệnh
        /thongke → Thống kê tổng quan hệ thống
        /dangky-moi → Đơn đăng ký gói khám mới
        /ho-tro-cho-duyet → Yêu cầu hỗ trợ đang chờ
        /lich-kham-cho-duyet → Lịch khám chờ duyệt
        /quyen-gop-hom-nay → Tổng tiền quyên góp hôm nay
        /clear → Xóa lịch sử chat

        Chỉ Admin mới dùng được
      `.trim(),
    },

    "/thongke": {
      description: "Thống kê tổng quan",
      handler: async () => {
        try {
          const [dash, pending] = await Promise.all([
            analyticsAPI.getDashboard(),
            analyticsAPI.getPendingCounts(),
          ]);

          const d = dash.data;
          const p = pending.data;

          return `
            **Thống kê MedicalHope+**

            **Người dùng**: ${d.totalUsers?.toLocaleString() || 0} (+${d.newUsersThisMonth || 0} mới)
            **Bác sĩ**: ${d.totalDoctors || 0}
            **Bệnh nhân xác minh**: ${d.verifiedPatients || 0}
            **Tổng quyên góp**: ${(d.totalDonations || 0).toLocaleString("vi-VN")}₫
            **Lịch khám**: ${d.totalAppointments || 0}

            **Chờ duyệt**
            • Đơn đăng ký: ${p.pendingRegistrations || 0}
            • Hỗ trợ y tế: ${p.pendingAssistance || 0}
            • Lịch khám: ${p.pendingAppointments || 0}
          `.trim();
        } catch {
          return "Lỗi lấy thống kê. Thử lại sau.";
        }
      },
    },

    "/dangky-moi": {
      description: "Đơn đăng ký mới",
      handler: async () => {
        try {
          const res = await registrationsAPI.getAll({ status: "pending", limit: 8 });
          const items = res.data.data || [];
          if (!items.length) return "Không có đơn đăng ký mới.";

          return `**Đơn đăng ký mới** (${items.length})\n\n` + items
            .map((r: any, i: number) =>
              `${i + 1}. ${r.fullName} (${r.phone})\n   → Gói: ${r.package?.name || "N/A"}\n   → ${new Date(r.createdAt).toLocaleDateString("vi-VN")}`
            )
            .join("\n\n");
        } catch {
          return "Lỗi lấy đơn đăng ký.";
        }
      },
    },

    "/ho-tro-cho-duyet": {
      description: "Yêu cầu hỗ trợ chờ duyệt",
      handler: async () => {
        try {
          const res = await assistanceAPI.getAll({ status: "pending", limit: 8 });
          const items = res.data.data || [];
          if (!items.length) return "Không có yêu cầu hỗ trợ nào.";

          return `**Hỗ trợ chờ duyệt** (${items.length})\n\n` + items
            .map((r: any, i: number) =>
              `${i + 1}. ${r.fullName} - ${r.phone}\n   → ${r.reason}\n   → ${new Date(r.createdAt).toLocaleDateString("vi-VN")}`
            )
            .join("\n\n");
        } catch {
          return "Lỗi lấy dữ liệu hỗ trợ.";
        }
      },
    },

    "/quyen-gop-hom-nay": {
      description: "Quyên góp hôm nay",
      handler: async () => {
        try {
          const today = new Date().toISOString().split("T")[0];
          const res = await donationsAPI.getAll({ donatedAfter: today });
          const total = (res.data.data || []).reduce((s: number, d: any) => s + (d.amount || 0), 0);

          return `**Quyên góp hôm nay** (${new Date().toLocaleDateString("vi-VN")}):\n**${total.toLocaleString("vi-VN")}₫**`;
        } catch {
          return "Lỗi lấy dữ liệu quyên góp.";
        }
      },
    },

    "/clear": {
      description: "Xóa lịch sử chat",
      handler: async () => {
        setMessages([{
          id: "cleared",
          type: "bot",
          content: "Đã xóa lịch sử trò chuyện hiện tại.",
          timestamp: new Date(),
        }]);
        return null;
      },
    },
  };

  // ==================== GỬI TIN NHẮN ====================
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userInput = inputValue.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: userInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // === 1. XỬ LÝ LỆNH ADMIN ===
    if (user?.role === "admin" && userInput.startsWith("/")) {
      const cmd = userInput.split(" ")[0].toLowerCase();
      const command = ADMIN_COMMANDS[cmd];

      if (command) {
        try {
          const result = await command.handler();
          if (result !== null) {
            setMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              type: "bot",
              content: result,
              timestamp: new Date(),
            }]);
          }
        } catch {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content: "Lỗi thực thi lệnh. Vui lòng thử lại.",
            timestamp: new Date(),
          }]);
        } finally {
          setIsTyping(false);
        }
        return;
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: `Lệnh \`${cmd}\` không tồn tại. Gõ **/help** để xem lệnh hợp lệ.`,
          timestamp: new Date(),
        }]);
        setIsTyping(false);
        return;
      }
    }

    // === 2. GỌI GEMINI AI (NGƯỜI DÙNG THƯỜNG HOẶC KHÔNG PHẢI LỆNH) ===
    try {
      if (!genAI) throw new Error("Gemini API key không tồn tại");

      const model = genAI.getGenerativeModel({
        model: availableModel,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        ],
      });

      const conversationHistory = messages.slice(-6).map(m =>
        `${m.type === "user" ? "Người dùng" : "MedicalHope+"}: ${m.content}`
      ).join("\n");

      const prompt = `
        Bạn là trợ lý AI tên MedicalHope+, nói tiếng Việt, thân thiện, lịch sự.
        Trả lời tất cả câu hỏi bằng tiếng Việt, kể Smash những câu không liên quan y tế.

        Lịch sử:
        ${conversationHistory}

        Người dùng: ${user ? user.fullName : "Khách"} (vai trò: ${user?.role || "none"})
        Câu hỏi: ${userInput}
      `;

      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: responseText,
        timestamp: new Date(),
      }]);
    } catch (error: any) {
      console.error("Lỗi AI:", error);
      const msg = error.message.includes("API key")
        ? "Hệ thống AI tạm thời không khả dụng."
        : "Xin lỗi, tôi gặp lỗi. Bạn thử hỏi lại nhé!";
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: msg,
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    "Đặt lịch khám bệnh",
    "Tìm bác sĩ chuyên khoa",
    "Quyên góp từ thiện",
    "Yêu cầu hỗ trợ y tế",
    ...(user ? [] : ["Đăng ký tài khoản"]),
    "Thông tin sức khỏe chung",
  ];

  return (
    <>
      {/* Bubble Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className="fixed bottom-2 right-4 z-50"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Button
              className="rounded-full w-14 h-14 bg-gradient-primary text-white shadow-lg hover:bg-primary/90"
              onClick={() => setIsOpen(true)}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="fixed bottom-3 right-3 w-80 md:w-96 h-[32rem] z-50"
          >
            <Card className="healthcare-card h-full flex flex-col shadow-xl">
              <CardHeader className="p-2 bg-gradient-primary text-white rounded-t-lg">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text-base">
                    <Bot className="mr-2 h-5 w-5" />
                    Trợ lý ảo MedicalHope+
                    {user?.role === "admin" && (
                      <Badge className="ml-2" variant="secondary">ADMIN</Badge>
                    )}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-white/80"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex items-start space-x-2 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.type === "bot" && (
                          <Avatar className="w-6 h-6 bg-gradient-primary">
                            <AvatarFallback><Bot className="h-3 w-3 text-white" /></AvatarFallback>
                          </Avatar>
                        )}

                        <div className={`max-w-[70%] px-3 py-1.5 rounded-lg whitespace-pre-line text-sm ${message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          {message.content}
                        </div>

                        {message.type === "user" && (
                          <Avatar className="w-6 h-6 bg-gradient-secondary">
                            <AvatarFallback><User className="h-3 w-3 text-white" /></AvatarFallback>
                          </Avatar>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6 bg-gradient-primary">
                        <AvatarFallback><Bot className="h-3 w-3 text-white" /></AvatarFallback>
                      </Avatar>
                      <div className="bg-muted px-3 py-1.5 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse" />
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="flex items-center space-x-2 mt-3">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 text-sm h-9"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="btn-healthcare h-9 w-9 p-0"
                  >
                    {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Quick Actions - Ẩn với Admin */}
                {user?.role !== "admin" && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {quickActions.map((action) => (
                      <Button
                        key={action}
                        variant="outline"
                        className="text-xs h-8"
                        onClick={() => {
                          setInputValue(action);
                          handleSendMessage();
                        }}
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Gợi ý lệnh cho Admin */}
                {user?.role === "admin" && (
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    Gõ <code>/help</code> để xem lệnh quản trị
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}