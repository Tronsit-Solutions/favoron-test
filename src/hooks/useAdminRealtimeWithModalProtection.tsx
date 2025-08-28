import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useModalProtection } from './useModalProtection';

interface AdminRealtimeUpdate {
  id: string;
  data: any;
  timestamp: number;
  type: 'package' | 'trip';
}

interface AdminRealtimeProps {
  onPackageUpdate?: (payload: any) => void;
  onTripUpdate?: (payload: any) => void;
  userRole?: 'admin' | 'traveler' | 'shopper';
  debounceMs?: number;
}

export const useAdminRealtimeWithModalProtection = ({
  onPackageUpdate,
  onTripUpdate,
  userRole = 'admin',
  debounceMs = 2000 // 2 seconds for better modal protection
}: AdminRealtimeProps) => {
  const { user } = useAuth();
  const { canRefresh } = useModalProtection();
  const updateQueueRef = useRef<Map<string, AdminRealtimeUpdate>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  const processQueue = useCallback(() => {
    if (updateQueueRef.current.size === 0) return;

    // Check if modals are open before processing
    if (!canRefresh()) {
      console.log('📱 Delaying admin realtime updates due to open modals');
      // Reschedule for later
      timeoutRef.current = setTimeout(processQueue, debounceMs);
      return;
    }

    const updates = Array.from(updateQueueRef.current.values());
    updateQueueRef.current.clear();

    console.log(`📦 Processing ${updates.length} queued admin updates`);
    
    // Group by type and process
    const packageUpdates = updates.filter(u => u.type === 'package');
    const tripUpdates = updates.filter(u => u.type === 'trip');

    // Process package updates
    if (packageUpdates.length > 0 && onPackageUpdate) {
      packageUpdates.forEach(update => onPackageUpdate(update.data));
    }

    // Process trip updates
    if (tripUpdates.length > 0 && onTripUpdate) {
      tripUpdates.forEach(update => onTripUpdate(update.data));
    }
  }, [onPackageUpdate, onTripUpdate, canRefresh, debounceMs]);

  const queueUpdate = useCallback((type: 'package' | 'trip', payload: any) => {
    const updateId = `${type}-${payload.new?.id || payload.id || Date.now()}`;
    
    updateQueueRef.current.set(updateId, {
      id: updateId,
      data: payload,
      timestamp: Date.now(),
      type
    });

    // Clear any existing timeout and set a new one
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(processQueue, debounceMs);
  }, [processQueue, debounceMs]);

  useEffect(() => {
    if (!user || userRole !== 'admin') return;

    console.log('🔗 Setting up admin realtime with modal protection');

    const channel = supabase
      .channel('admin-realtime-protected')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'packages'
        },
        (payload) => {
          console.log('📦 Package update received:', payload.eventType);
          queueUpdate('package', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips'
        },
        (payload) => {
          console.log('✈️ Trip update received:', payload.eventType);
          queueUpdate('trip', payload);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, userRole, queueUpdate]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    processQueuedUpdates: processQueue
  };
};