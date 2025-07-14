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

      await fetchMessages(); // Refresh messages
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
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

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('package-chat-files')
        .getPublicUrl(filePath);

      // Create message record
      const { error: messageError } = await supabase
        .from('package_messages')
        .insert({
          package_id: packageId,
          user_id: user.id,
          message_type: 'file_upload',
          content: description || `Archivo subido: ${file.name}`,
          file_url: urlData.publicUrl,
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
      const { data, error } = await supabase.storage
        .from('package-chat-files')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        toast({
          title: "Error",
          description: "No se pudo descargar el archivo",
          variant: "destructive",
        });
        return;
      }

      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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