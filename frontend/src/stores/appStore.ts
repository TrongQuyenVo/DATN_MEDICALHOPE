import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Notification {
  id: string;
  type: "appointment" | "donation" | "system" | "reminder" | "alert";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface PaymentInfo {
  donationId: string;
  amount: number;
  method: string;
  status?: string;
}

interface AppState {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setNotifications: (notifications: Notification[]) => void;

  // Language
  language: "vi" | "en";
  setLanguage: (language: "vi" | "en") => void;

  // Theme
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Socket connection
  isSocketConnected: boolean;
  setSocketConnected: (connected: boolean) => void;

  // Donation
  donationId: string | null;
  setDonationId: (id: string | null) => void;

  // Payment info
  paymentInfo: PaymentInfo | null;
  setPaymentInfo: (info: PaymentInfo) => void;
  clearPaymentInfo: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Notifications
      notifications: [],
      unreadCount: 0,
      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + (notification.read ? 0 : 1),
        }));
      },
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            read: true,
          })),
          unreadCount: 0,
        }));
      },
      setNotifications: (notifications) => {
        const unreadCount = notifications.filter((n) => !n.read).length;
        set({ notifications, unreadCount });
      },

      // Language
      language: "vi",
      setLanguage: (language) => set({ language }),

      // Theme
      theme: "light",
      setTheme: (theme) => set({ theme }),

      // Loading
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),

      // Socket
      isSocketConnected: false,
      setSocketConnected: (isSocketConnected) => set({ isSocketConnected }),

      // Donation
      donationId: null,
      setDonationId: (donationId) => set({ donationId }),

      // Payment info (persisted)
      paymentInfo: null,
      setPaymentInfo: (paymentInfo) => set({ paymentInfo }),
      clearPaymentInfo: () => set({ paymentInfo: null }),
    }),
    {
      name: "app-storage", // tên key lưu trong localStorage
      partialize: (state) => ({
        // chỉ lưu các phần cần thiết
        language: state.language,
        theme: state.theme,
        paymentInfo: state.paymentInfo,
      }),
    }
  )
);
