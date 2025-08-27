
import { Package } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle } from 'lucide-react';
import { getUserRole } from '@/utils/chatHelpers';
import { usePackageTimeline } from '@/hooks/usePackageTimeline';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface PackageTimelineProps {
  pkg: Package;
  className?: string;
}

export const PackageTimeline = ({ pkg, className }: PackageTimelineProps) => {
  const { user } = useAuth();
  const { 
    messages, 
    loading, 
    handleSendMessage, 
    handleFileUpload, 
    handleDownload 
  } = usePackageTimeline({
    packageId: pkg.id,
  });

  if (loading) {
    return (
      <Card className={className}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Comunicación</h3>
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
    <Card className={`${className} bg-gradient-to-br from-background to-muted/20 border-0 shadow-lg`}>
      {/* Enhanced chat container */}
      <div className="flex justify-start p-4">
        {/* Modern chatbox with improved design */}
        <div className="w-full">
          {/* Enhanced Chat Header */}
          <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gradient-to-r from-primary/20 via-primary/10 to-transparent">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg shadow-sm">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Chat del Paquete</h3>
                <p className="text-xs text-muted-foreground">Comunicación en tiempo real</p>
              </div>
            </div>
          </div>

          {/* Enhanced Messages Container */}
          <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/30 shadow-inner p-2 mb-3">
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent pr-2">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="p-3 bg-gradient-to-br from-background/80 to-muted/30 rounded-full w-fit mx-auto mb-3 shadow-sm">
                    <MessageCircle className="h-6 w-6 opacity-40" />
                  </div>
                  <p className="text-sm font-medium mb-1">No hay mensajes</p>
                  <p className="text-xs opacity-75">Inicia la conversación</p>
                </div>
              ) : (
                messages.map((message) => {
                  const role = getUserRole(message.user_id, pkg);
                  
                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      role={role}
                      onDownload={handleDownload}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Enhanced Message Input Section */}
          <div className="bg-gradient-to-r from-background to-muted/20 rounded-lg border border-border/30 p-2">
            <MessageInput
              onSendMessage={handleSendMessage}
              onFileUpload={handleFileUpload}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
