
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
    <Card className={className}>
      <div className="p-4 md:p-6">
        {/* Chat Header */}
        <div className="border-b border-border/50 pb-4 mb-6">
          <h3 className="text-lg md:text-xl font-semibold flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <span className="hidden sm:inline">Historial & Mensajes</span>
            <span className="sm:hidden">Chat</span>
          </h3>
        </div>

        {/* Messages Container */}
        <div className="bg-muted/30 rounded-lg border border-muted/50 p-4 mb-6">
          <div className="space-y-4 max-h-48 md:max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-muted-foreground">
                <div className="p-4 bg-background/50 rounded-full w-fit mx-auto mb-4">
                  <MessageCircle className="h-12 w-12 md:h-16 md:w-16 opacity-50" />
                </div>
                <p className="text-base md:text-lg font-medium mb-2">No hay mensajes aún</p>
                <p className="text-sm md:text-base">Inicia la conversación enviando un mensaje</p>
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

        {/* Message Input Section */}
        <div className="border-t border-border/50 pt-4">
          <MessageInput
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            disabled={loading}
          />
        </div>
      </div>
    </Card>
  );
};
