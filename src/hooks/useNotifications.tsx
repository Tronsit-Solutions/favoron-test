import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'package' | 'trip' | 'payment' | 'approval' | 'quote' | 'delivery' | 'general';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  action_url?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const PAGE_SIZE = 20;

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) throw error;

      setNotifications((data || []) as Notification[]);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
      setHasMore((data?.length || 0) >= PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Fetch more notifications (pagination)
  const fetchMore = async () => {
    if (!userId || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const offset = notifications.length;
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      const newItems = (data || []) as Notification[];
      setNotifications(prev => [...prev, ...newItems]);
      setHasMore(newItems.length >= PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching more notifications:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Create notification
  const createNotification = async (
    targetUserId: string,
    title: string,
    message: string,
    type: Notification['type'] = 'general',
    priority: Notification['priority'] = 'normal',
    actionUrl?: string,
    metadata?: any,
    sendEmail: boolean = false
  ) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          title,
          message,
          type,
          priority,
          action_url: actionUrl,
          metadata
        })
        .select()
        .single();

      if (error) throw error;

      // Show toast for high priority notifications
      if (priority === 'high' || priority === 'urgent') {
        toast({
          title: title,
          description: message,
        });
      }

      // Send email notification if requested or for high priority notifications
      if (sendEmail || priority === 'high' || priority === 'urgent') {
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              userId: targetUserId,
              title,
              message,
              type,
              priority,
              actionUrl,
              metadata
            }
          });
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Don't fail the notification creation if email fails
        }
      }

      // WhatsApp notifications removed - only welcome template available
      // High priority notifications are handled via email above

      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    let channel: any = null;

    try {
      channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
            setUnreadCount(prev => prev + 1);

            // Show toast for new notifications
            if (newNotification.priority === 'high' || newNotification.priority === 'urgent') {
              toast({
                title: newNotification.title,
                description: newNotification.message,
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const updatedNotification = payload.new as Notification;
            setNotifications(prev =>
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            );
          }
        );

      // Subscribe with error handling
      channel.subscribe((status: string, err?: any) => {
        if (err) {
          console.warn('Notifications realtime subscription error:', err);
          // Continue without realtime - will use polling instead
        } else if (status === 'SUBSCRIBED') {
          console.log('Notifications realtime subscription active');
        }
      });

    } catch (error) {
      console.warn('Failed to set up notifications realtime subscription:', error);
      // App will continue to work with polling, just without real-time updates
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.warn('Error removing notifications channel:', error);
        }
      }
    };
  }, [userId, toast]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    refetch: fetchNotifications
  };
};