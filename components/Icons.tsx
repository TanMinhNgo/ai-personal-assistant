import React from 'react';

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const WhatsAppIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
  style,
}) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.704 1.456h.006c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const GmailIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
  style,
}) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

export const TelegramIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
  style,
}) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M9.78 18.65l.28-4.28 7.68-6.92c.34-.31-.07-.47-.52-.18L7.69 13.2 3.53 11.9c-.9-.28-.92-.9.19-1.34l16.29-6.28c.75-.28 1.4.17 1.15 1.36l-2.77 13.05c-.2 1-.8 1.24-1.64.78l-4.22-3.12-2.03 1.95c-.23.23-.42.42-.87.42z" />
  </svg>
);

export const OutlookIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
  style,
}) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  </svg>
);

export const PlatformIcon: React.FC<{
  platform: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ platform, className, style }) => {
  switch (platform) {
    case 'whatsapp':
      return <WhatsAppIcon className={className} style={style} />;
    case 'gmail':
      return <GmailIcon className={className} style={style} />;
    case 'telegram':
      return <TelegramIcon className={className} style={style} />;
    case 'outlook':
      return <OutlookIcon className={className} style={style} />;
    default:
      return null;
  }
};
