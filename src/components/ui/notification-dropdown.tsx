import { Bell, Check, Package, CreditCard, AlertCircle, Clock, Plane, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { NotificationSheet } from "@/components/ui/NotificationSheet";

interface NotificationDropdownProps {
  userId?: string;
  userRole?: string;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'package':
      return <Package className="h-4 w-4 text-blue-500" />;
    case 'payment':
      return <CreditCard className="h-4 w-4 text-green-500" />;
    case 'approval':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'quote':
      return <Clock className="h-4 w-4 text-purple-500" />;
    case 'trip':
      return <Plane className="h-4 w-4 text-indigo-500" />;
    case 'delivery':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getPriorityColor = (priority: Notification['priority']) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'normal':
      return 'bg-blue-500';
    case 'low':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};

// Build action URL based on notification type and metadata
const getActionUrl = (notification: Notification): string | null => {
  // If explicit action_url exists, use it
  if (notification.action_url) {
    return notification.action_url;
  }

  const metadata = (notification.metadata || {}) as Record<string, any>;
  
  switch (notification.type) {
    case 'package':
      // Chat messages, new packages, quote accepted
      if (metadata.package_id) {
        return `/dashboard?package=${metadata.package_id}&openChat=true`;
      }
      break;
      
    case 'quote':
      // Quote reminders, expirations
      if (metadata.package_id) {
        return `/dashboard?package=${metadata.package_id}`;
      }
      break;
      
    case 'trip':
      // Trip updates
      if (metadata.trip_id) {
        return `/dashboard?tab=trips&trip=${metadata.trip_id}`;
      }
      break;
      
    case 'payment':
      // Payment notifications for admin
      return '/dashboard?tab=admin&matching=payments';
      
    case 'delivery':
      // Office delivery confirmations
      if (metadata.package_id) {
        return `/dashboard?package=${metadata.package_id}`;
      }
      break;
      
    case 'approval':
      // Approval notifications
      if (metadata.package_id) {
        return `/dashboard?package=${metadata.package_id}`;
      }
      if (metadata.trip_id) {
        return `/dashboard?tab=trips&trip=${metadata.trip_id}`;
      }
      break;
  }
  
  return '/dashboard';
};

export const NotificationDropdown = ({ userId, userRole }: NotificationDropdownProps) => {
  const { notifications, loading, loadingMore, unreadCount, hasMore, markAsRead, markAllAsRead, fetchMore } = useNotifications(userId);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const handleNotificationClick = (notification: Notification) => {
    // Close the popover
    setOpen(false);
    
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to action URL
    const url = getActionUrl(notification);
    if (url) {
      navigate(url);
    }
  };

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-5"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-background border shadow-lg z-50" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs shrink-0"
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Cargando notificaciones...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No tienes notificaciones
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
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
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: es
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setOpen(false);
                  setSheetOpen(true);
                }}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>

    <NotificationSheet
      open={sheetOpen}
      onOpenChange={setSheetOpen}
      notifications={notifications}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      unreadCount={unreadCount}
      markAsRead={markAsRead}
      markAllAsRead={markAllAsRead}
      fetchMore={fetchMore}
    />
    </>
  );
};