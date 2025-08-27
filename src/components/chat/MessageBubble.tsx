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
    <div className="flex gap-3 group hover:bg-muted/20 rounded-lg p-2 -m-2 transition-colors duration-200">
      <Avatar className="h-10 w-10 shrink-0 border-2 border-background shadow-sm">
        {message.user_profile?.avatar_url ? (
          <AvatarImage src={message.user_profile.avatar_url} alt={`Avatar de ${userName}`} />
        ) : (
          <AvatarFallback className={`text-sm font-semibold ${styles.avatar}`}>
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-semibold text-sm text-foreground">{userName}</span>
          <Badge variant="secondary" className={`text-xs px-2 py-0.5 ${styles.badge}`}>
            {getRoleLabel(role)}
          </Badge>
          <span className="text-xs text-muted-foreground/80 font-medium">
            {format(new Date(message.created_at), 'dd MMM, HH:mm', { locale: es })}
          </span>
        </div>
        
        <div className={`rounded-xl px-4 py-3 shadow-sm border ${styles.message} transition-all duration-200 hover:shadow-md`}>
          <div className="flex items-start gap-3">
            <MessageIcon messageType={message.message_type} />
            <div className="flex-1">
              {message.content && (
                <p className="text-sm leading-relaxed break-words">{message.content}</p>
              )}
              
              {message.message_type === 'file_upload' && message.file_url && (
                <div className="mt-3 p-3 bg-muted/40 rounded-lg border border-border/50">
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