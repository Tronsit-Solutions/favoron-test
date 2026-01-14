import { supabase } from '@/integrations/supabase/client';

// Template IDs that match the Twilio Content Templates configured in the edge function
export type WhatsAppTemplateId = 'welcome' | 'quote_received';

interface SendWhatsAppTemplateParams {
  userId: string;
  templateId: WhatsAppTemplateId;
  variables?: Record<string, string>;
}

// Send WhatsApp notification using pre-approved Twilio templates
export const sendWhatsAppNotification = async (params: SendWhatsAppTemplateParams) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
      body: {
        user_id: params.userId,
        template_id: params.templateId,
        variables: params.variables || {}
      }
    });

    if (error) throw error;
    console.log('✅ WhatsApp notification sent:', { userId: params.userId, templateId: params.templateId });
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error sending WhatsApp notification:', error);
    return { success: false, error };
  }
};
