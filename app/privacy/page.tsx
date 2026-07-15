import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Privacy Policy | OmniMind' };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary="This policy explains how OmniMind handles personal information, including Gmail data that you choose to connect."
      sections={[
        {
          title: 'Information we process',
          paragraphs: [
            'OmniMind processes account information needed to provide the service, such as your email address and profile details. When you connect Gmail, OmniMind receives the permissions you approve through Google OAuth.',
          ],
        },
        {
          title: 'Gmail data',
          paragraphs: [
            'We use Gmail data only to provide features you request, such as reading messages, creating drafts, sending messages, and organizing labels. We do not sell Gmail data or use it for advertising.',
          ],
        },
        {
          title: 'How credentials are protected',
          paragraphs: [
            'OAuth credentials are handled on the server and stored in an encrypted, HTTP-only browser cookie. The cookie is scoped to the signed-in connection and expires after 30 days unless you disconnect earlier.',
          ],
        },
        {
          title: 'Sharing',
          paragraphs: [
            'We do not share Gmail message content with third parties except when required to provide a feature you explicitly request, comply with law, or protect the security of OmniMind and its users.',
          ],
        },
        {
          title: 'Your choices',
          items: [
            'Disconnect Gmail from OmniMind to remove the local connection credential.',
            'Revoke OmniMind access from your Google Account at any time.',
            'Request access, correction, or deletion of personal information through the support channel provided in the app.',
          ],
        },
        {
          title: 'Changes to this policy',
          paragraphs: [
            'We may update this policy when our product or data practices change. We will publish the updated version on this page with a new effective date.',
          ],
        },
      ]}
    />
  );
}
