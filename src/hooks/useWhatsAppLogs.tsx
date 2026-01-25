import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WhatsAppLog {
  id: string;
  user_id: string | null;
  phone_number: string;
  user_name: string | null;
  template_id: string;
  template_variables: Record<string, string> | null;
  status: 'sent' | 'failed' | 'skipped';
  twilio_sid: string | null;
  error_message: string | null;
  error_code: number | null;
  skip_reason: string | null;
  created_at: string;
  response_data: any;
  // Delivery tracking fields from Twilio webhook
  delivery_status: string | null;
  delivery_error_code: string | null;
  delivered_at: string | null;
}

export interface WhatsAppStats {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
}

interface UseWhatsAppLogsOptions {
  statusFilter?: 'all' | 'sent' | 'failed' | 'skipped';
  templateFilter?: string;
  searchQuery?: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit?: number;
}

export const useWhatsAppLogs = (options: UseWhatsAppLogsOptions = {}) => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [stats, setStats] = useState<WhatsAppStats>({ total: 0, sent: 0, failed: 0, skipped: 0 });
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  
  const limit = options.limit || 50;

  const fetchStats = useCallback(async () => {
    try {
      // Get counts by status
      const { data: sentData } = await supabase
        .from('whatsapp_notification_logs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'sent');
      
      const { data: failedData } = await supabase
        .from('whatsapp_notification_logs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed');
      
      const { data: skippedData } = await supabase
        .from('whatsapp_notification_logs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'skipped');

      const { count: sentCount } = await supabase
        .from('whatsapp_notification_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent');
      
      const { count: failedCount } = await supabase
        .from('whatsapp_notification_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed');
      
      const { count: skippedCount } = await supabase
        .from('whatsapp_notification_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'skipped');

      setStats({
        total: (sentCount || 0) + (failedCount || 0) + (skippedCount || 0),
        sent: sentCount || 0,
        failed: failedCount || 0,
        skipped: skippedCount || 0
      });
    } catch (error) {
      console.error('Error fetching WhatsApp stats:', error);
    }
  }, []);

  const fetchLogs = useCallback(async (resetOffset = true) => {
    try {
      setLoading(true);
      const currentOffset = resetOffset ? 0 : offset;
      
      let query = supabase
        .from('whatsapp_notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);

      // Apply filters
      if (options.statusFilter && options.statusFilter !== 'all') {
        query = query.eq('status', options.statusFilter);
      }

      if (options.templateFilter && options.templateFilter !== 'all') {
        query = query.eq('template_id', options.templateFilter);
      }

      if (options.searchQuery) {
        query = query.or(`phone_number.ilike.%${options.searchQuery}%,user_name.ilike.%${options.searchQuery}%`);
      }

      if (options.dateFrom) {
        query = query.gte('created_at', options.dateFrom.toISOString());
      }

      if (options.dateTo) {
        const endOfDay = new Date(options.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const typedData = (data || []) as unknown as WhatsAppLog[];
      
      if (resetOffset) {
        setLogs(typedData);
        setOffset(limit);
      } else {
        setLogs(prev => [...prev, ...typedData]);
        setOffset(prev => prev + limit);
      }

      setHasMore(typedData.length === limit);
    } catch (error) {
      console.error('Error fetching WhatsApp logs:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los logs de WhatsApp',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [options.statusFilter, options.templateFilter, options.searchQuery, options.dateFrom, options.dateTo, limit, offset, toast]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchLogs(false);
    }
  }, [loading, hasMore, fetchLogs]);

  const resendNotification = useCallback(async (log: WhatsAppLog) => {
    try {
      // Build request body - if user_id exists, let edge function fetch updated phone from profile
      const body: Record<string, unknown> = {
        template_id: log.template_id,
        variables: log.template_variables || {}
      };
      
      if (log.user_id) {
        body.user_id = log.user_id;
        // Don't include phone_number - edge function will fetch corrected number from profile
      } else {
        // Only use log's phone_number if no user_id available
        body.phone_number = log.phone_number;
      }

      const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
        body
      });

      if (error) throw error;

      toast({
        title: 'Notificación reenviada',
        description: data?.sent ? 'El mensaje fue enviado exitosamente' : 'El mensaje fue procesado',
      });

      // Refresh logs
      fetchLogs(true);
      fetchStats();
    } catch (error) {
      console.error('Error resending notification:', error);
      toast({
        title: 'Error',
        description: 'No se pudo reenviar la notificación',
        variant: 'destructive'
      });
    }
  }, [fetchLogs, fetchStats, toast]);

  // Initial fetch
  useEffect(() => {
    fetchLogs(true);
    fetchStats();
  }, [options.statusFilter, options.templateFilter, options.searchQuery, options.dateFrom, options.dateTo]);

  const refresh = useCallback(() => {
    fetchLogs(true);
    fetchStats();
  }, [fetchLogs, fetchStats]);

  return {
    logs,
    stats,
    loading,
    hasMore,
    loadMore,
    refresh,
    resendNotification
  };
};
