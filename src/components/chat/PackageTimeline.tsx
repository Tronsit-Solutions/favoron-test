import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Package, Trip } from '@/types';
import { PackageMessage } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { usePackageChat } from '@/hooks/usePackageChat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, File, Upload, Download, Send, Paperclip } from 'lucide-react';

interface PackageTimelineProps {
  pkg: Package;
  className?: string;
}

export const PackageTimeline = ({ pkg, className }: PackageTimelineProps) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage, uploadFile, downloadFile } = usePackageChat({
    packageId: pkg.id,
  });
  
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const getUserRole = (userId: string): 'shopper' | 'traveler' | 'admin' => {
    if (userId === pkg.user_id) return 'shopper';
    if (pkg.matched_trip_id) return 'traveler'; // Assuming current user is traveler if viewing matched package
    return 'admin';
  };

  const getUserName = (message: PackageMessage): string => {
    const profile = message.user_profile;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.username) {
      return profile.username;
    }
    return getUserRole(message.user_id) === 'shopper' ? 'Shopper' : 'Viajero';
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const success = await sendMessage(newMessage.trim());
    if (success) {
      setNewMessage('');
    }
    setIsSending(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isUploading) return;

    setIsUploading(true);
    await uploadFile(file);
    setIsUploading(false);
    
    // Reset input
    event.target.value = '';
  };

  const renderMessageIcon = (type: string) => {
    switch (type) {
      case 'file_upload':
        return <File className="h-4 w-4" />;
      case 'status_update':
        return <Upload className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: 'shopper' | 'traveler' | 'admin') => {
    switch (role) {
      case 'shopper':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'traveler':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: 'shopper' | 'traveler' | 'admin') => {
    switch (role) {
      case 'shopper':
        return 'Shopper';
      case 'traveler':
        return 'Viajero';
      case 'admin':
        return 'Admin';
      default:
        return 'Usuario';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Historial & Mensajes</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Historial & Mensajes
        </h3>

        {/* Timeline */}
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay mensajes aún</p>
              <p className="text-sm">Inicia la conversación enviando un mensaje</p>
            </div>
          ) : (
            messages.map((message) => {
              const role = getUserRole(message.user_id);
              const userName = getUserName(message);
              
              return (
                <div key={message.id} className="flex gap-3 group">
                  <Avatar className="h-8 w-8 shrink-0">
                    <div className={`h-full w-full rounded-full flex items-center justify-center text-xs font-medium ${getRoleColor(role)}`}>
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{userName}</span>
                      <Badge variant="outline" className={`text-xs ${getRoleColor(role)}`}>
                        {getRoleLabel(role)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.created_at), 'dd MMM, HH:mm', { locale: es })}
                      </span>
                    </div>
                    
                    <div className={`p-3 rounded-lg ${
                      message.user_id === user?.id 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'bg-muted border border-border'
                    }`}>
                      <div className="flex items-start gap-2">
                        {renderMessageIcon(message.message_type)}
                        <div className="flex-1">
                          {message.content && (
                            <p className="text-sm break-words">{message.content}</p>
                          )}
                          
                          {message.message_type === 'file_upload' && message.file_url && (
                            <div className="mt-2 p-2 bg-background rounded border">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <File className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span className="text-sm truncate">
                                    {message.file_name || 'Archivo'}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => downloadFile(message.file_url!, message.file_name || 'archivo')}
                                  className="shrink-0"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input */}
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Textarea
                placeholder="Escribe un mensaje... (máx 300 caracteres)"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value.slice(0, 300))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="min-h-[60px] resize-none"
                disabled={isSending}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">
                  {newMessage.length}/300
                </span>
                <div className="flex gap-2">
                  <label htmlFor="file-upload">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isUploading}
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
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {isSending ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};