import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UnreadMessageCount {
  [packageId: string]: number;
}

export const useUnreadChatMessages = () => {
  const [unreadCounts, setUnreadCounts] = useState<UnreadMessageCount>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchUnreadCounts = async () => {
    if (!user?.id) {
      setUnreadCounts({});
      setLoading(false);
      return;
    }

    try {
      // Get unread package-related notifications for the current user
      const { data, error } = await supabase
        .from('notifications')
        .select('metadata, id')
        .eq('user_id', user.id)
        .eq('type', 'package')
        .eq('read', false)
        .not('metadata->package_id', 'is', null);

      if (error) {
        console.error('Error fetching unread notifications:', error);
        return;
      }

      // Count unread messages by package_id
      const counts: UnreadMessageCount = {};
      data?.forEach(notification => {
        const metadata = notification.metadata as any;
        const packageId = metadata?.package_id;
        if (packageId && metadata?.message_id) {
          counts[packageId] = (counts[packageId] || 0) + 1;
        }
      });

      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error in fetchUnreadCounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markPackageMessagesAsRead = async (packageId: string) => {
    if (!user?.id || !packageId) return;

    try {
      // Mark all package-related notifications as read for this package
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('type', 'package')
        .eq('read', false)
        .filter('metadata->package_id', 'eq', packageId);

      if (error) {
        console.error('Error marking notifications as read:', error);
        return;
      }

      // Update local state
      setUnreadCounts(prev => {
        const updated = { ...prev };
        delete updated[packageId];
        return updated;
      });

      console.log(`✅ Marked notifications as read for package: ${packageId}`);
    } catch (error) {
      console.error('Error in markPackageMessagesAsRead:', error);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    fetchUnreadCounts();

    const channel = supabase
      .channel('notifications-unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Notification change detected:', payload);
          
          // Refetch counts when notifications change
          fetchUnreadCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  }, [unreadCounts]);

  return {
    unreadCounts,
    totalUnreadCount,
    loading,
    markPackageMessagesAsRead,
    refetchUnreadCounts: fetchUnreadCounts
  };
};