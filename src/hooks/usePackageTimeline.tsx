import { usePackageChat } from '@/hooks/usePackageChat';
import { useToast } from '@/hooks/use-toast';

interface UsePackageTimelineProps {
  packageId: string;
}

export const usePackageTimeline = ({ packageId }: UsePackageTimelineProps) => {
  const { messages, loading, sendMessage, uploadFile, downloadFile, refreshMessages } = usePackageChat({
    packageId,
  });
  const { toast } = useToast();

  const handleSendMessage = async (message: string): Promise<void> => {
    try {
      const success = await sendMessage(message);
      if (!success) {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleFileUpload = async (file: File): Promise<void> => {
    try {
      const success = await uploadFile(file);
      if (!success) {
        throw new Error('Failed to upload file');
      }
      toast({
        title: "Archivo subido",
        description: "El archivo se ha subido correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleDownload = async (url: string, filename: string): Promise<void> => {
    try {
      await downloadFile(url, filename);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo descargar el archivo",
        variant: "destructive"
      });
    }
  };

  return {
    messages,
    loading,
    handleSendMessage,
    handleFileUpload,
    handleDownload,
    refreshMessages
  };
};