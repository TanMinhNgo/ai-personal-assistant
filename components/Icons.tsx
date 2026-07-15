import { Inbox, Mail, MessageCircle, Send } from 'lucide-react';

export const PlatformIcon: React.FC<{
  platform: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ platform, className, style }) => {
  const props = { className, style, 'aria-hidden': true };

  switch (platform) {
    case 'whatsapp':
      return <MessageCircle {...props} />;
    case 'gmail':
      return <Mail {...props} />;
    case 'telegram':
      return <Send {...props} />;
    case 'outlook':
      return <Inbox {...props} />;
    default:
      return null;
  }
};
