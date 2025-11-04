import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, MessageCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/authStore";
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";

interface User {
  _id?: string;
  fullName?: string;
  role?: string;
}

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
}

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Key lưu trữ theo user
  const getChatStorageKey = useCallback(() => {
    return user?._id ? `chatMessages_${user._id}` : "chatMessages_guest";
  }, [user]);

  const [messages, setMessages] = useState<Message[]>(() => {
    const key = getChatStorageKey();
    const saved = localStorage.getItem(key);
    return saved
      ? JSON.parse(saved, (k, v) => (k === "timestamp" ? new Date(v) : v))
      : [
        {
          id: "1",
          type: "bot",
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
  const [streamingMessage, setStreamingMessage] = useState<string>("");

  // Gemini AI
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  const model = useMemo(() => {
    if (!genAI) return null;
    return genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ],
    });
  }, [genAI]);

  // Lưu tin nhắn
  useEffect(() => {
    const key = getChatStorageKey();
    localStorage.setItem(key, JSON.stringify(messages));
  }, [messages, getChatStorageKey]);

  // Xóa chat cũ khi đổi user
  useEffect(() => {
    const last = localStorage.getItem("lastChatUserId");
    if (last && last !== user?._id && last !== "guest") {
      localStorage.removeItem(`chatMessages_${last}`);
    }
    localStorage.setItem("lastChatUserId", user?._id || "guest");
  }, [user]);

  // Scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  // Gửi tin nhắn
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !model) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((p) => [...p, userMsg]);
    setInputValue("");
    setIsTyping(true);
    setStreamingMessage("");

    try {
      const recent = messages
        .slice(-3)
        .map((m) => `${m.type === "user" ? "Người dùng" : "Bot"}: ${m.content}`)
        .join("\n");

      const prompt = `Bạn là MedicalHope+, trợ lý y tế thân thiện, trả lời bằng tiếng Việt, ngắn gọn, tự nhiên.

Hướng dẫn:
- Đặt lịch → Vào "Bác sĩ"
- Quyên góp → Vào "Quyên góp"
- Hỗ trợ → Vào "Hỗ trợ"

Lịch sử:
${recent}

Người dùng: ${userMsg.content}

Trả lời ngắn, rõ, tối đa 3 dòng nếu có thể.`;

      const result = await model.generateContentStream([prompt]);
      let full = "";

      for await (const chunk of result.stream) {
        const txt = chunk.text();
        full += txt;
        setStreamingMessage(full);
      }

      setMessages((p) => [...p, { id: (Date.now() + 1).toString(), type: "bot", content: full, timestamp: new Date() }]);
      setStreamingMessage("");
    } catch (e: any) {
      console.error(e);
      const err = e.message.includes("API")
        ? "Hệ thống AI hiện không khả dụng. Vui lòng liên hệ hỗ trợ."
        : "Xin lỗi, tôi gặp lỗi khi xử lý. Bạn có thể hỏi lại!";
      setMessages((p) => [...p, { id: (Date.now() + 1).toString(), type: "bot", content: err, timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, model, messages, user]);

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
      {/* Chat Bubble Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-3 right-4 z-50"
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
            transition={{ duration: 0.3 }}
            className="fixed bottom-3 right-3 w-80 md:w-96 h-[32rem] z-50"
          >
            <Card className="healthcare-card h-full flex flex-col shadow-xl">
              <CardHeader className="p-2 bg-gradient-primary text-white rounded-t-lg">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text-base">
                    <Bot className="mr-2 h-5 w-5" />
                    Trợ lý ảo MedicalHope+
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
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex items-start space-x-2 ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.type === "bot" && (
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-gradient-primary">
                              <Bot className="h-3 w-3 text-white" />
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`max-w-[70%] px-3 py-1.5 rounded-lg whitespace-pre-line text-sm ${msg.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                            }`}
                        >
                          {msg.content}
                        </div>

                        {msg.type === "user" && (
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-gradient-secondary">
                              <User className="h-3 w-3 text-white" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </motion.div>
                    ))}

                    {/* Streaming */}
                    {streamingMessage && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-start space-x-2"
                      >
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-gradient-primary">
                            <Bot className="h-3 w-3 text-white" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted px-3 py-1.5 rounded-lg text-sm">
                          {streamingMessage}
                          <span className="inline-block w-2 h-4 bg-gray-500 animate-pulse ml-1"></span>
                        </div>
                      </motion.div>
                    )}

                    {/* Typing */}
                    {isTyping && !streamingMessage && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center space-x-2"
                      >
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-gradient-primary">
                            <Bot className="h-3 w-3 text-white" />
                          </AvatarFallback>
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
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex items-center space-x-2 mt-3">
                  <Input
                    ref={inputRef}
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

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {quickActions.map((action, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="text-xs h-8 py-1 px-2"
                      onClick={() => {
                        setInputValue(action);
                        setTimeout(handleSendMessage, 100);
                      }}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}