import { MessageCircle, File, Upload } from 'lucide-react';

interface MessageIconProps {
  messageType: string;
  className?: string;
}

export const MessageIcon = ({ messageType, className = "h-4 w-4" }: MessageIconProps) => {
  switch (messageType) {
    case 'file_upload':
      return <File className={className} />;
    case 'status_update':
      return <Upload className={className} />;
    default:
      return <MessageCircle className={className} />;
  }
};