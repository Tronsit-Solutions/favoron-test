import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MessageCounts {
  [packageId: string]: number;
}

export const usePackageMessageCounts = () => {
  const [messageCounts, setMessageCounts] = useState<MessageCounts>({});
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();

  const fetchMessageCounts = async () => {
    if (!user?.id) {
      setMessageCounts({});
      setLoading(false);
      return;
    }

    try {
      if (userRole?.role === 'admin') {
        // Admin: contar mensajes para todos los paquetes
        const { data, error } = await supabase
          .from('package_messages')
          .select('package_id');

        if (error) {
          console.error('Error fetching message counts (admin):', error);
          setMessageCounts({});
        } else {
          const counts: MessageCounts = {};
          data?.forEach((message) => {
            const packageId = message.package_id;
            counts[packageId] = (counts[packageId] || 0) + 1;
          });
          setMessageCounts(counts);
        }
      } else {
        // Usuario normal: obtener paquetes a los que tiene acceso (shopper o traveler)
        const { data: accessiblePackages, error: packagesError } = await supabase
          .from('packages')
          .select('id')
          .or(`user_id.eq.${user.id}`);

        if (packagesError) {
          console.error('Error fetching accessible packages:', packagesError);
          setMessageCounts({});
        } else if (!accessiblePackages || accessiblePackages.length === 0) {
          setMessageCounts({});
        } else {
          const packageIds = accessiblePackages.map((p) => p.id);
          const { data, error } = await supabase
            .from('package_messages')
            .select('package_id')
            .in('package_id', packageIds);

          if (error) {
            console.error('Error fetching message counts:', error);
            setMessageCounts({});
          } else {
            const counts: MessageCounts = {};
            data?.forEach((message) => {
              const packageId = message.package_id;
              counts[packageId] = (counts[packageId] || 0) + 1;
            });
            setMessageCounts(counts);
          }
        }
      }
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
  }, [user?.id, userRole?.role]);

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