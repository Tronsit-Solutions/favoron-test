import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useModalProtection } from './useModalProtection';

interface ConsolidatedRealtimeUpdate {
  id: string;
  type: 'package' | 'trip';
  data: any;
  timestamp: number;
  eventType: string;
}

interface ConsolidatedRealtimeProps {
  onPackageUpdate?: (packages: any[] | ((prev: any[]) => any[])) => void;
  onTripUpdate?: (trips: any[] | ((prev: any[]) => any[])) => void;
  onIncrement?: (data: any) => void;
  packages?: any[];
  trips?: any[];
  userRole?: 'admin' | 'traveler' | 'shopper';
  enabled?: boolean;
  recentMutationsRef?: React.MutableRefObject<Record<string, number>>;
}

export const useConsolidatedRealtimeAdmin = ({
  onPackageUpdate,
  onTripUpdate,
  onIncrement,
  packages = [],
  trips = [],
  userRole = 'admin',
  enabled = true,
  recentMutationsRef
}: ConsolidatedRealtimeProps) => {
  const { user } = useAuth();
  const { canRefresh, hasOpenModals } = useModalProtection();
  const [isRealtimePaused, setIsRealtimePaused] = useState(false);
  
  const updateQueueRef = useRef<Map<string, ConsolidatedRealtimeUpdate>>(new Map());
  const channelRef = useRef<any>(null);
  const processTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Process incremental updates without full refresh using functional updates
  const applyIncrementalUpdate = useCallback((update: ConsolidatedRealtimeUpdate) => {
    const { type, data, eventType } = update;
    
    console.log(`🔄 Applying incremental ${type} update:`, eventType);

    if (type === 'package' && onPackageUpdate) {
      // Use functional update to avoid stale closure
      onPackageUpdate((currentPackages: any[]) => {
        const updatedPackages = [...currentPackages];
        const packageIndex = updatedPackages.findIndex(p => p.id === data.new?.id || data.old?.id);
        
        if (eventType === 'DELETE' && packageIndex >= 0) {
          updatedPackages.splice(packageIndex, 1);
        } else if (eventType === 'INSERT') {
          // Add new packages at the beginning for better visibility
          updatedPackages.unshift(data.new);
        } else if (eventType === 'UPDATE' && packageIndex >= 0) {
          updatedPackages[packageIndex] = { ...updatedPackages[packageIndex], ...data.new };
        }
        
        return updatedPackages;
      });
      onIncrement?.(data);
    }

    if (type === 'trip' && onTripUpdate) {
      // Use functional update to avoid stale closure
      onTripUpdate((currentTrips: any[]) => {
        const updatedTrips = [...currentTrips];
        const tripIndex = updatedTrips.findIndex(t => t.id === data.new?.id || data.old?.id);
        
        if (eventType === 'DELETE' && tripIndex >= 0) {
          updatedTrips.splice(tripIndex, 1);
        } else if (eventType === 'INSERT') {
          // Add new trips at the beginning for better visibility
          updatedTrips.unshift(data.new);
        } else if (eventType === 'UPDATE' && tripIndex >= 0) {
          updatedTrips[tripIndex] = { ...updatedTrips[tripIndex], ...data.new };
        }
        
        return updatedTrips;
      });
    }
  }, [onPackageUpdate, onTripUpdate, onIncrement]);

  // Process queued updates when modals close
  const processQueuedUpdates = useCallback(() => {
    if (updateQueueRef.current.size === 0) return;
    
    console.log(`📦 Processing ${updateQueueRef.current.size} queued admin updates`);
    
    const updates = Array.from(updateQueueRef.current.values());
    updateQueueRef.current.clear();
    
    // Apply updates incrementally
    updates.forEach(applyIncrementalUpdate);
    
    setIsRealtimePaused(false);
  }, [applyIncrementalUpdate]);

  // Queue update for later processing
  const queueUpdate = useCallback((type: 'package' | 'trip', payload: any) => {
    const updateId = `${type}-${payload.new?.id || payload.old?.id || Date.now()}`;
    
    console.log(`📥 Queuing ${type} update (modals open):`, payload.eventType);
    
    updateQueueRef.current.set(updateId, {
      id: updateId,
      type,
      data: payload,
      timestamp: Date.now(),
      eventType: payload.eventType
    });

    setIsRealtimePaused(true);
  }, []);

  // Handle real-time payload
  const handleRealtimeUpdate = useCallback((type: 'package' | 'trip', payload: any) => {
    if (!enabled) {
      console.log(`🚫 Realtime disabled for ${type}`);
      return;
    }

    // Check if modals are open
    if (!canRefresh()) {
      console.log(`📱 Queuing ${type} update - modals open`);
      queueUpdate(type, payload);
      return;
    }

    // Apply immediately if no modals open
    console.log(`⚡ Applying immediate ${type} update:`, payload.eventType);
    applyIncrementalUpdate({
      id: `${type}-${payload.new?.id || payload.old?.id || Date.now()}`,
      type,
      data: payload,
      timestamp: Date.now(),
      eventType: payload.eventType
    });
  }, [enabled, canRefresh, queueUpdate, applyIncrementalUpdate]);

  // Monitor modal state changes
  useEffect(() => {
    const modalCheck = () => {
      const hasModals = hasOpenModals();
      
      if (!hasModals && updateQueueRef.current.size > 0) {
        console.log('📱 Modals closed - processing queued updates');
        if (processTimeoutRef.current) {
          clearTimeout(processTimeoutRef.current);
        }
        processTimeoutRef.current = setTimeout(processQueuedUpdates, 500);
      }
    };

    const interval = setInterval(modalCheck, 1000);
    return () => clearInterval(interval);
  }, [hasOpenModals, processQueuedUpdates]);

  // Setup Supabase real-time subscriptions
  useEffect(() => {
    if (!user || userRole !== 'admin' || !enabled) {
      console.log('🚫 Admin realtime not enabled');
      return;
    }

    console.log('🔗 Setting up consolidated admin realtime');

    const channel = supabase
      .channel('consolidated-admin-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'packages'
        },
        (payload) => handleRealtimeUpdate('package', payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips'
        },
        (payload) => handleRealtimeUpdate('trip', payload)
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      console.log('🔌 Cleaning up consolidated admin realtime');
      if (processTimeoutRef.current) {
        clearTimeout(processTimeoutRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, userRole, enabled, handleRealtimeUpdate]);

  return {
    isRealtimePaused,
    queuedUpdates: updateQueueRef.current.size,
    processQueuedUpdates: processQueuedUpdates,
    clearQueue: () => {
      updateQueueRef.current.clear();
      setIsRealtimePaused(false);
    }
  };
};