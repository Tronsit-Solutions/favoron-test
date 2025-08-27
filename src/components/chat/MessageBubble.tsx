
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PackageMessage } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserRole, getUserDisplayName, getRoleStyles, getRoleLabel } from '@/utils/chatHelpers';
import { MessageIcon } from './MessageIcon';
import { FileAttachment } from './FileAttachment';

interface MessageBubbleProps {
  message: PackageMessage;
  role: UserRole;
  onDownload: (url: string, filename: string) => void;
}

export const MessageBubble = ({ message, role, onDownload }: MessageBubbleProps) => {
  const userName = getUserDisplayName(message, role);
  const styles = getRoleStyles(role);

  return (
    <div className="flex gap-2 group hover:bg-muted/20 rounded-lg p-1.5 -m-1.5 transition-colors duration-200 w-full">
      <Avatar className="h-8 w-8 shrink-0 border border-background shadow-sm">
        {message.user_profile?.avatar_url ? (
          <AvatarImage src={message.user_profile.avatar_url} alt={`Avatar de ${userName}`} />
        ) : (
          <AvatarFallback className={`text-xs font-semibold ${styles.avatar}`}>
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-xs text-foreground truncate">{userName}</span>
          <Badge variant="secondary" className={`text-xs px-1.5 py-0.5 ${styles.badge} shrink-0`}>
            {getRoleLabel(role)}
          </Badge>
          <span className="text-xs text-muted-foreground/80 font-medium shrink-0">
            {format(new Date(message.created_at), 'dd MMM, HH:mm', { locale: es })}
          </span>
        </div>
        
        <div className={`rounded-lg px-3 py-2 shadow-sm border ${styles.message} transition-all duration-200 hover:shadow-md max-w-full`}>
          <div className="flex items-start gap-2">
            <MessageIcon messageType={message.message_type} />
            <div className="flex-1 min-w-0 overflow-hidden">
              {message.content && (
                <p className="text-sm leading-relaxed break-words overflow-wrap-anywhere">{message.content}</p>
              )}
              
              {message.message_type === 'file_upload' && message.file_url && (
                <div className="mt-2 p-2 bg-muted/40 rounded-lg border border-border/50">
                  <FileAttachment
                    fileUrl={message.file_url}
                    fileName={message.file_name}
                    fileType={message.file_type}
                    onDownload={onDownload}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
