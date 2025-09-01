
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
    <div className="bg-background/80 backdrop-blur-sm rounded-md border border-border/60 p-2">
      <div className="space-y-2">
        <div className="relative">
          <Textarea
            placeholder="Escribe un mensaje..."
            value={message}
            onChange={(e) => {
              const newValue = e.target.value.slice(0, 300);
              setMessage(newValue);
            }}
            className="min-h-[50px] resize-none text-sm pr-4 pl-3 py-2 border-0 bg-muted/40 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            disabled={isSending || disabled}
          />
          <div className="absolute bottom-1 right-2 text-xs text-muted-foreground/70 font-mono">
            {message.length}/300
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="file-upload">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isUploading || disabled}
                asChild
                className="h-8 px-2 text-sm hover:bg-muted/60 transition-colors"
              >
                <span className="cursor-pointer flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  <span className="hidden sm:inline text-xs">
                    {isUploading ? 'Subiendo...' : 'Adjuntar'}
                  </span>
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
          </div>
          
          <Button 
            size="sm" 
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending || disabled}
            className="h-8 px-3 text-sm font-medium bg-primary hover:bg-primary/90 transition-all duration-200 shadow-sm"
          >
            <Send className="h-3 w-3 mr-1" />
            {isSending ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </div>
    </div>
  );
};
