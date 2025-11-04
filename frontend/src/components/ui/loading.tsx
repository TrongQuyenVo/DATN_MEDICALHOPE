import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loading({ size = 'md', className }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn('animate-spin rounded-full border-2 border-current border-t-transparent', sizeClasses[size], className)} />
  );
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loading size="lg" className="mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="healthcare-card p-6">
        <Loading size="lg" className="mx-auto mb-4 text-primary" />
        <p className="text-center text-sm text-muted-foreground">Đang xử lý...</p>
      </div>
    </div>
  );
}