import { motion } from 'framer-motion';
import { Bell, Calendar, Gift, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ScrollToTop from '@/components/layout/ScrollToTop';
import ChatBubble from './ChatbotPage';

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      type: 'appointment',
      title: 'Lịch hẹn được xác nhận',
      message: 'Lịch hẹn với BS. Nguyễn Văn A vào 14:00 ngày 25/12/2024 đã được xác nhận.',
      read: false,
      createdAt: '2024-12-23T10:30:00Z'
    },
    {
      id: 2,
      type: 'donation',
      title: 'Nhận được quyên góp',
      message: 'Bạn đã nhận được 500,000 VNĐ từ nhà hảo tâm cho yêu cầu hỗ trợ.',
      read: false,
      createdAt: '2024-12-23T08:15:00Z'
    },
    {
      id: 3,
      type: 'reminder',
      title: 'Nhắc nhở lịch khám',
      message: 'Bạn có lịch khám với BS. Trần Thị B vào 10:00 sáng mai.',
      read: true,
      createdAt: '2024-12-22T18:00:00Z'
    },
    {
      id: 4,
      type: 'system',
      title: 'Hồ sơ được phê duyệt',
      message: 'Yêu cầu hỗ trợ y tế của bạn đã được phê duyệt và đang được quyên góp.',
      read: true,
      createdAt: '2024-12-22T14:20:00Z'
    },
    {
      id: 5,
      type: 'alert',
      title: 'Cần cập nhật thông tin',
      message: 'Vui lòng cập nhật thông tin liên hệ để nhận hỗ trợ tốt nhất.',
      read: false,
      createdAt: '2024-12-21T16:45:00Z'
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return Calendar;
      case 'donation': return Gift;
      case 'reminder': return Clock;
      case 'system': return CheckCircle;
      case 'alert': return AlertTriangle;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment': return 'text-primary';
      case 'donation': return 'text-success';
      case 'reminder': return 'text-warning';
      case 'system': return 'text-secondary';
      case 'alert': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} ngày trước`;
    } else if (hours > 0) {
      return `${hours} giờ trước`;
    } else {
      return 'Vừa xong';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="healthcare-heading text-3xl font-bold flex items-center">
            <Bell className="mr-3 h-8 w-8" />
            Thông báo
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-destructive text-destructive-foreground">
                {unreadCount} mới
              </Badge>
            )}
          </h1>
          <p className="healthcare-subtitle">Cập nhật mới nhất về hoạt động và lịch hẹn của bạn</p>
        </div>
        <Button variant="outline">
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      {/* Notification Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="healthcare-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thông báo</CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">Tất cả thông báo</p>
          </CardContent>
        </Card>
        <Card className="healthcare-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chưa đọc</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Cần xem</p>
          </CardContent>
        </Card>
        <Card className="healthcare-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hôm nay</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">2</div>
            <p className="text-xs text-muted-foreground">Thông báo mới</p>
          </CardContent>
        </Card>
        <Card className="healthcare-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quan trọng</CardTitle>
            <Gift className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">1</div>
            <p className="text-xs text-muted-foreground">Cần chú ý</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="healthcare-card">
        <CardHeader>
          <CardTitle className="healthcare-heading">Danh sách thông báo</CardTitle>
          <CardDescription>Tất cả thông báo của bạn theo thời gian</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification, index) => {
              const Icon = getNotificationIcon(notification.type);
              const iconColor = getNotificationColor(notification.type);

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors hover:bg-muted/50 ${!notification.read ? 'bg-primary/5 border-primary/20' : ''
                    }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center ${!notification.read ? 'bg-primary/10' : ''
                    }`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className={`font-medium ${!notification.read ? 'text-primary' : ''}`}>
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 w-2 h-2 bg-primary rounded-full inline-block" />
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button variant="ghost" size="sm">
                          Đánh dấu đã đọc
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <ScrollToTop />
      <ChatBubble />
    </motion.div>
  );
}