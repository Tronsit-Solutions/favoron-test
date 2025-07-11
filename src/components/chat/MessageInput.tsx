import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';
import { validateFile } from '@/utils/chatHelpers';
import { useToast } from '@/hooks/use-toast';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  onFileUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export const MessageInput = ({ onSendMessage, onFileUpload, disabled }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!message.trim() || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage('');
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isUploading || disabled) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      await onFileUpload(file);
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
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="border-t pt-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Textarea
            placeholder="Escribe un mensaje... (máx 300 caracteres)"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 300))}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] resize-none"
            disabled={isSending || disabled}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">
              {message.length}/300
            </span>
            <div className="flex gap-2">
              <label htmlFor="file-upload">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isUploading || disabled}
                  asChild
                >
                  <span className="cursor-pointer">
                    <Paperclip className="h-3 w-3 mr-1" />
                    {isUploading ? 'Subiendo...' : 'Adjuntar'}
                  </span>
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
                disabled={isUploading || disabled}
              />
              <Button 
                size="sm" 
                onClick={handleSendMessage}
                disabled={!message.trim() || isSending || disabled}
              >
                <Send className="h-3 w-3 mr-1" />
                {isSending ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};