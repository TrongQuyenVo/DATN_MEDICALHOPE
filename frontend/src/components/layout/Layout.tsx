import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/stores/authStore';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import ChatBubble from '@/pages/ChatbotPage';
import ScrollToTop from './ScrollToTop';

function LayoutContent() {
  const { isCollapsed } = useSidebar();
  const { user } = useAuthStore();
  const allowedRoles = ['patient', 'doctor'];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-full z-30">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: isCollapsed ? '80px' : '280px' }}
      >
        {/* Fixed Header */}
        <div
          className="fixed top-0 right-0 z-20 transition-all duration-300"
          style={{ left: isCollapsed ? '80px' : '280px' }}
        >
          <Header />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 mt-16 overflow-auto">
          <Outlet />
        </main>

        {/* ChatBubble */}
        {allowedRoles.includes(user?.role) && <ChatBubble />}
      </div>

      {/* NÚT SCROLL TO TOP – HIỆN TRONG LAYOUT ĐÃ ĐĂNG NHẬP */}
      <ScrollToTop />
    </div>
  );
}

export function Layout() {
  const { isAuthenticated } = useAuthStore();

  // Nếu CHƯA đăng nhập → vẫn hiển thị nút ScrollToTop
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
        {/* NÚT SCROLL TO TOP – HIỆN TRONG TRANG CÔNG KHAI */}
        <ScrollToTop />
      </div>
    );
  }

  // Nếu ĐÃ đăng nhập → dùng Layout đầy đủ
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}