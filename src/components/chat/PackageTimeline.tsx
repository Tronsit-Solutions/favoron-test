
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
      {/* Flex container to position chatbox on the left */}
      <div className="flex justify-start">
        {/* Compact chatbox - left aligned, half width */}
        <div className="w-full sm:w-1/2 md:max-w-md p-1">
          {/* Chat Header */}
          <div className="border-b border-border/50 pb-1 mb-2">
            <h3 className="text-xs font-medium flex items-center gap-1">
              <div className="p-1 bg-primary/10 rounded">
                <MessageCircle className="h-3 w-3 text-primary" />
              </div>
              <span>Chat</span>
            </h3>
          </div>

          {/* Messages Container - Extra compact */}
          <div className="bg-muted/30 rounded border border-muted/50 p-1 mb-1">
            <div className="space-y-1 max-h-12 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="text-center py-2 text-muted-foreground">
                  <div className="p-1 bg-background/50 rounded-full w-fit mx-auto mb-1">
                    <MessageCircle className="h-4 w-4 opacity-50" />
                  </div>
                  <p className="text-xs">No hay mensajes</p>
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
          <div className="border-t border-border/50 pt-1">
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
