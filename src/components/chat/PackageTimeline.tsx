
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
      <div className="p-1 md:p-2">
        {/* Chat Header */}
        <div className="border-b border-border/50 pb-2 mb-3">
          <h3 className="text-sm md:text-base font-semibold flex items-center gap-2">
            <div className="p-1 bg-primary/10 rounded-lg">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            <span className="hidden sm:inline">Chat</span>
            <span className="sm:hidden">Chat</span>
          </h3>
        </div>

        {/* Messages Container - Much smaller */}
        <div className="bg-muted/30 rounded-lg border border-muted/50 p-1 mb-2">
          <div className="space-y-1 max-h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="text-center py-3 text-muted-foreground">
                <div className="p-2 bg-background/50 rounded-full w-fit mx-auto mb-2">
                  <MessageCircle className="h-6 w-6 opacity-50" />
                </div>
                <p className="text-xs font-medium mb-1">No hay mensajes</p>
                <p className="text-xs">Envía un mensaje</p>
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
        <div className="border-t border-border/50 pt-2">
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
