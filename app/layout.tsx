import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bluo — Find your people',
  description: 'See who is nearby, find your free friends and stay connected at college.',
  applicationName: 'Bluo',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = { themeColor: '#0b74ff', width: 'device-width', initialScale: 1, maximumScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}