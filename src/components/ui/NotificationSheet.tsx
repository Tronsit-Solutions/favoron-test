import { Bell, Check, Package, CreditCard, Clock, Plane, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Notification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface NotificationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: Notification[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  fetchMore: () => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'package': return <Package className="h-4 w-4 text-blue-500" />;
    case 'payment': return <CreditCard className="h-4 w-4 text-green-500" />;
    case 'approval': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'quote': return <Clock className="h-4 w-4 text-purple-500" />;
    case 'trip': return <Plane className="h-4 w-4 text-indigo-500" />;
    case 'delivery': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    default: return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

const getPriorityColor = (priority: Notification['priority']) => {
  switch (priority) {
    case 'urgent': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'normal': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

const getActionUrl = (notification: Notification): string | null => {
  if (notification.action_url) return notification.action_url;
  const metadata = (notification.metadata || {}) as Record<string, any>;
  switch (notification.type) {
    case 'package':
      if (metadata.package_id) return `/dashboard?package=${metadata.package_id}&openChat=true`;
      break;
    case 'quote':
      if (metadata.package_id) return `/dashboard?package=${metadata.package_id}`;
      break;
    case 'trip':
      if (metadata.trip_id) return `/dashboard?tab=trips&trip=${metadata.trip_id}`;
      break;
    case 'payment':
      return '/dashboard?tab=admin&matching=payments';
    case 'delivery':
      if (metadata.package_id) return `/dashboard?package=${metadata.package_id}`;
      break;
    case 'approval':
      if (metadata.package_id) return `/dashboard?package=${metadata.package_id}`;
      if (metadata.trip_id) return `/dashboard?tab=trips&trip=${metadata.trip_id}`;
      break;
  }
  return '/dashboard';
};

export const NotificationSheet = ({
  open,
  onOpenChange,
  notifications,
  loading,
  loadingMore,
  hasMore,
  unreadCount,
  markAsRead,
  markAllAsRead,
  fetchMore,
}: NotificationSheetProps) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const handleClick = (notification: Notification) => {
    if (!notification.read) markAsRead(notification.id);
    const url = getActionUrl(notification);
    if (url) navigate(url);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="text-xs"
            >
              Todas
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
              className="text-xs"
            >
              No leídas
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Cargando notificaciones...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                  onClick={() => handleClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className={`text-sm font-medium truncate ${
                          !notification.read ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(notification.priority)}`} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filter === 'all' && hasMore && !loading && (
            <div className="p-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Cargando...' : 'Cargar más'}
              </Button>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
