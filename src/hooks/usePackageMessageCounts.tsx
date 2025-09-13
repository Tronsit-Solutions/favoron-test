import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MessageCounts {
  [packageId: string]: number;
}

export const usePackageMessageCounts = () => {
  const [messageCounts, setMessageCounts] = useState<MessageCounts>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMessageCounts = async () => {
    if (!user?.id) {
      setMessageCounts({});
      setLoading(false);
      return;
    }

    try {
      // Get packages the user has access to (shopper, traveler, or admin)
      const { data: accessiblePackages, error: packagesError } = await supabase
        .from('packages')
        .select('id')
        .or(`user_id.eq.${user.id},matched_trip_id.in.(select id from trips where user_id = ${user.id})`);

      if (packagesError) {
        console.error('Error fetching accessible packages:', packagesError);
        return;
      }

      if (!accessiblePackages || accessiblePackages.length === 0) {
        setMessageCounts({});
        setLoading(false);
        return;
      }

      const packageIds = accessiblePackages.map(p => p.id);

      // Count all messages for each package
      const { data, error } = await supabase
        .from('package_messages')
        .select('package_id')
        .in('package_id', packageIds);

      if (error) {
        console.error('Error fetching message counts:', error);
        return;
      }

      // Count messages by package_id
      const counts: MessageCounts = {};
      data?.forEach(message => {
        const packageId = message.package_id;
        counts[packageId] = (counts[packageId] || 0) + 1;
      });

      setMessageCounts(counts);
    } catch (error) {
      console.error('Error in fetchMessageCounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    fetchMessageCounts();

    const channel = supabase
      .channel('package-messages-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'package_messages'
        },
        (payload) => {
          console.log('📨 Package message change detected:', payload);
          // Refetch counts when messages change
          fetchMessageCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const hasMessages = (packageId: string): boolean => {
    return (messageCounts[packageId] || 0) > 0;
  };

  return {
    messageCounts,
    hasMessages,
    loading,
    refetchMessageCounts: fetchMessageCounts
  };
};