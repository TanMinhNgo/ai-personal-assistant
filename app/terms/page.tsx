import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Terms of Service | OmniMind' };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      summary="These terms govern your use of OmniMind and any third-party account you choose to connect."
      sections={[
        {
          title: 'Using OmniMind',
          paragraphs: [
            'You may use OmniMind only in compliance with applicable law and these terms. You are responsible for the accuracy of information you provide and for activity performed through your account.',
          ],
        },
        {
          title: 'Connected accounts',
          paragraphs: [
            'Connecting Gmail is optional. You authorize OmniMind to access only the Google permissions shown on the consent screen. You may disconnect the account or revoke access from your Google Account at any time.',
          ],
        },
        {
          title: 'Your responsibilities',
          items: [
            'Keep your account credentials secure.',
            'Review drafts and messages before sending them.',
            'Do not use OmniMind to send unlawful, harmful, deceptive, or unsolicited communications.',
          ],
        },
        {
          title: 'Third-party services',
          paragraphs: [
            'Google and other connected services are governed by their own terms and privacy policies. OmniMind is not responsible for their availability, content, or actions.',
          ],
        },
        {
          title: 'Service availability',
          paragraphs: [
            'We may change, suspend, or discontinue parts of OmniMind when necessary to maintain, improve, or secure the service.',
          ],
        },
        {
          title: 'Changes to these terms',
          paragraphs: [
            'We may update these terms from time to time. Continuing to use OmniMind after an update means you accept the revised terms.',
          ],
        },
      ]}
    />
  );
}
