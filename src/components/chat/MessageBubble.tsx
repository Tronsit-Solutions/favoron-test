import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PackageMessage } from '@/types';
import { Avatar } from '@/components/ui/avatar';
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
    <div className="flex gap-3 group">
      <Avatar className="h-8 w-8 shrink-0">
        <div className={`h-full w-full rounded-full flex items-center justify-center text-xs font-medium ${styles.avatar}`}>
          {userName.charAt(0).toUpperCase()}
        </div>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{userName}</span>
          <Badge variant="outline" className={`text-xs ${styles.badge}`}>
            {getRoleLabel(role)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.created_at), 'dd MMM, HH:mm', { locale: es })}
          </span>
        </div>
        
        <div className={`p-3 rounded-lg ${styles.message}`}>
          <div className="flex items-start gap-2">
            <MessageIcon messageType={message.message_type} />
            <div className="flex-1">
              {message.content && (
                <p className="text-sm break-words">{message.content}</p>
              )}
              
              {message.message_type === 'file_upload' && message.file_url && (
                <div className="mt-3 max-w-full overflow-hidden">
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