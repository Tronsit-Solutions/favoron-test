import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PackageMessage } from '@/types';
import { sendWhatsAppNotification, WhatsAppTemplates } from '@/lib/whatsappNotifications';

interface UsePackageChatProps {
  packageId: string;
}

export const usePackageChat = ({ packageId }: UsePackageChatProps) => {
  const [messages, setMessages] = useState<PackageMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMessages = async () => {
    if (!packageId) return;

    try {
      const { data, error } = await supabase
        .from('package_messages')
        .select(`
          *,
          user_profile:profiles!user_id (
            first_name,
            last_name,
            username
          )
        `)
        .eq('package_id', packageId)
        .in('message_type', ['text', 'file_upload']) // Solo mostrar mensajes directos y archivos del chat
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los mensajes",
          variant: "destructive",
        });
        return;
      }

      setMessages((data as PackageMessage[]) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, type: 'text' | 'status_update' = 'text') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para enviar mensajes",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('package_messages')
        .insert({
          package_id: packageId,
          user_id: user.id,
          message_type: type,
          content: content.trim(),
        });

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "No se pudo enviar el mensaje",
          variant: "destructive",
        });
        return false;
      }

      // Send WhatsApp notification to recipient (only for text messages, not status updates)
      if (type === 'text') {
        await sendChatNotification(user.id, 'text');
      }

      await fetchMessages(); // Refresh messages
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  const sendChatNotification = async (senderId: string, messageType: 'text' | 'file_upload') => {
    try {
      // Get package and trip information to determine recipient
      const { data: pkg, error: pkgError } = await supabase
        .from('packages')
        .select('user_id, item_description, matched_trip_id')
        .eq('id', packageId)
        .single();

      if (pkgError || !pkg) {
        console.error('Error fetching package for notification:', pkgError);
        return;
      }

      let recipientId: string | null = null;
      let senderRole: 'shopper' | 'traveler' = 'shopper';

      // Determine recipient based on sender
      if (senderId === pkg.user_id) {
        // Sender is shopper, recipient is traveler
        senderRole = 'shopper';
        if (pkg.matched_trip_id) {
          const { data: trip } = await supabase
            .from('trips')
            .select('user_id')
            .eq('id', pkg.matched_trip_id)
            .single();
          
          recipientId = trip?.user_id || null;
        }
      } else {
        // Sender is traveler, recipient is shopper
        senderRole = 'traveler';
        recipientId = pkg.user_id;
      }

      // Skip if no recipient (e.g., no traveler assigned yet)
      if (!recipientId) {
        return;
      }

      // Get sender name
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', senderId)
        .single();

      const senderName = senderProfile 
        ? [senderProfile.first_name, senderProfile.last_name].filter(Boolean).join(' ')
        : 'un usuario';

      // Prepare short package description
      const packageDesc = pkg.item_description.length > 50 
        ? pkg.item_description.substring(0, 50) + '...'
        : pkg.item_description;

      // Select appropriate template
      let notification;
      if (messageType === 'file_upload') {
        notification = senderRole === 'shopper'
          ? WhatsAppTemplates.newFileFromShopper(senderName, packageDesc)
          : WhatsAppTemplates.newFileFromTraveler(senderName, packageDesc);
      } else {
        notification = senderRole === 'shopper'
          ? WhatsAppTemplates.newChatMessageFromShopper(senderName, packageDesc)
          : WhatsAppTemplates.newChatMessageFromTraveler(senderName, packageDesc);
      }

      // Send notification
      await sendWhatsAppNotification({
        userId: recipientId,
        ...notification,
        actionUrl: 'https://favoron.app/dashboard'
      });
    } catch (error) {
      console.error('Error sending chat notification:', error);
      // Don't throw - notification failure shouldn't block the message
    }
  };

  const uploadFile = async (file: File, description?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para subir archivos",
          variant: "destructive",
        });
        return false;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${packageId}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('package-chat-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast({
          title: "Error",
          description: "No se pudo subir el archivo",
          variant: "destructive",
        });
        return false;
      }

      // Create signed URL for secure storage  
      const { data: signedData, error: signError } = await supabase.storage
        .from('package-chat-files')
        .createSignedUrl(filePath, 86400); // 24 hour expiry for message files

      if (signError || !signedData?.signedUrl) {
        console.error('Error creating signed URL:', signError);
        toast({
          title: "Error",
          description: "No se pudo procesar el archivo",
          variant: "destructive",
        });
        return false;
      }

      // Create message record with signed URL
      const { error: messageError } = await supabase
        .from('package_messages')
        .insert({
          package_id: packageId,
          user_id: user.id,
          message_type: 'file_upload',
          content: description || `Archivo subido: ${file.name}`,
          file_url: signedData.signedUrl,
          file_name: file.name,
          file_type: file.type,
        });

      if (messageError) {
        console.error('Error creating message:', messageError);
        toast({
          title: "Error",
          description: "No se pudo registrar el archivo",
          variant: "destructive",
        });
        return false;
      }

      // Send WhatsApp notification for file upload
      await sendChatNotification(user.id, 'file_upload');

      await fetchMessages(); // Refresh messages
      toast({
        title: "Éxito",
        description: "Archivo subido correctamente",
      });
      return true;
    } catch (error) {
      console.error('Error uploading file:', error);
      return false;
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      // If we received a full URL, open it directly (backwards compatible)
      if (/^https?:\/\//i.test(filePath)) {
        window.open(filePath, '_blank', 'noopener,noreferrer');
        return;
      }

      // Otherwise, treat as a storage path and create a signed URL
      const { data, error } = await supabase.storage
        .from('package-chat-files')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error || !data?.signedUrl) {
        console.error('Error creating signed URL:', error);
        toast({
          title: "Error",
          description: "No se pudo descargar el archivo",
          variant: "destructive",
        });
        return;
      }

      // Open the signed URL in a new tab safely
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel(`package-messages-${packageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'package_messages',
          filter: `package_id=eq.${packageId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [packageId]);

  return {
    messages,
    loading,
    sendMessage,
    uploadFile,
    downloadFile,
    refreshMessages: fetchMessages,
  };
};