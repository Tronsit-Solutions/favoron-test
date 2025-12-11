import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type TripChangeType = 'receiving_window' | 'delivery_date' | 'address';

interface TripChangeAlert {
  notificationId: string;
  changeType: TripChangeType;
  changedAt: string;
  tripId: string;
}

export function useTripChangeAlerts(packageId: string | undefined) {
  const { user } = useAuth();
  const [alert, setAlert] = useState<TripChangeAlert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !packageId) {
      setLoading(false);
      return;
    }

    const fetchAlerts = async () => {
      try {
        const { data: notifications, error } = await supabase
          .from('notifications')
          .select('id, metadata, created_at')
          .eq('user_id', user.id)
          .eq('type', 'trip')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching trip change alerts:', error);
          setLoading(false);
          return;
        }

        // Find notification that includes this packageId in metadata (no seenOnCard filter - badge is persistent)
        const relevantNotification = notifications?.find(n => {
          const metadata = n.metadata as any;
          return metadata?.packageIds?.includes(packageId);
        });

        if (relevantNotification) {
          const metadata = relevantNotification.metadata as any;
          setAlert({
            notificationId: relevantNotification.id,
            changeType: metadata.changeType,
            changedAt: metadata.changedAt || relevantNotification.created_at,
            tripId: metadata.tripId
          });
        } else {
          setAlert(null);
        }
      } catch (err) {
        console.error('Error in useTripChangeAlerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`trip-alerts-${packageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, packageId]);

  return {
    hasUnreadChanges: !!alert,
    changeType: alert?.changeType,
    changedAt: alert?.changedAt,
    loading
  };
}
