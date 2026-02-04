import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PackageMessage } from '@/types';

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
            username,
            avatar_url
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

      // Fetch user roles for all message authors
      const userIds = [...new Set((data || []).map(m => m.user_id))];
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Create roles map, prioritizing 'admin' role when user has multiple roles
      const rolesMap = new Map<string, string>();
      rolesData?.forEach(r => {
        // Only update if no role exists yet, or if the new role is 'admin'
        if (!rolesMap.has(r.user_id) || r.role === 'admin') {
          rolesMap.set(r.user_id, r.role);
        }
      });
      const messagesWithRoles = (data || []).map(m => ({
        ...m,
        user_roles: rolesMap.has(m.user_id) ? [{ role: rolesMap.get(m.user_id)! }] : undefined
      }));

      setMessages(messagesWithRoles as PackageMessage[]);
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

      // Send email notification to the other party (only for text messages)
      if (type === 'text') {
        sendChatEmailNotification(content.trim(), 'text', user.id);
      }

      await fetchMessages(); // Refresh messages
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  const sendChatEmailNotification = async (
    messageContent: string, 
    messageType: 'text' | 'file_upload',
    senderUserId: string
  ) => {
    try {
      // Get package details to determine shopper and traveler
      const { data: packageData, error: pkgError } = await supabase
        .from('packages')
        .select(`
          id,
          user_id,
          item_description,
          matched_trip_id,
          trips!fk_packages_matched_trip (
            id,
            user_id
          )
        `)
        .eq('id', packageId)
        .single();

      if (pkgError || !packageData) {
        console.log('Could not fetch package data for chat notification');
        return;
      }

      const shopperId = packageData.user_id;
      const travelerId = (packageData.trips as any)?.user_id;

      // If no traveler assigned, skip notification
      if (!travelerId) {
        console.log('No traveler assigned, skipping chat notification');
        return;
      }

      // Determine recipient (the other party)
      let recipientId: string;
      let senderRole: string;

      if (senderUserId === shopperId) {
        recipientId = travelerId;
        senderRole = 'shopper';
      } else if (senderUserId === travelerId) {
        recipientId = shopperId;
        senderRole = 'viajero';
      } else {
        // Sender is admin or other - skip notification to avoid noise
        console.log('Sender is not shopper or traveler, skipping notification');
        return;
      }

      // Get sender name
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', senderUserId)
        .single();

      const senderName = senderProfile 
        ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || 'Usuario'
        : 'Usuario';

      // Truncate message for preview
      const messagePreview = messageContent.length > 100 
        ? messageContent.substring(0, 100) + '...' 
        : messageContent;

      const itemDescription = packageData.item_description || 'tu paquete';
      const truncatedItem = itemDescription.length > 50 
        ? itemDescription.substring(0, 50) + '...' 
        : itemDescription;

      // Build email content
      const title = messageType === 'file_upload' 
        ? `Nuevo archivo de ${senderName}`
        : `Nuevo mensaje de ${senderName}`;

      const message = messageType === 'file_upload'
        ? `<p><strong>${senderName}</strong> (${senderRole}) ha enviado un archivo en el chat de tu paquete:</p>
           <p style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin: 16px 0;">"${messagePreview}"</p>
           <p><strong>Paquete:</strong> ${truncatedItem}</p>`
        : `<p><strong>${senderName}</strong> (${senderRole}) te ha enviado un mensaje:</p>
           <p style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin: 16px 0; font-style: italic;">"${messagePreview}"</p>
           <p><strong>Paquete:</strong> ${truncatedItem}</p>`;

      // Send email notification
      await supabase.functions.invoke('send-notification-email', {
        body: {
          user_id: recipientId,
          title,
          message,
          type: 'chat',
          priority: 'normal',
          action_url: 'https://favoron.app/dashboard',
          metadata: {
            package_id: packageId,
            sender_id: senderUserId,
            message_type: messageType
          }
        }
      });

      console.log('Chat email notification sent to:', recipientId);
    } catch (error) {
      console.error('Error sending chat email notification:', error);
      // Don't throw - email notification failure shouldn't block chat
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

      // Send email notification to the other party
      sendChatEmailNotification(
        description || `Archivo subido: ${file.name}`, 
        'file_upload', 
        user.id
      );

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