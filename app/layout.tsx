import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ProductionTools } from '@/components/ProductionTools';
import { AuthGate } from '@/components/AuthGate';

export const metadata: Metadata = {
  metadataBase: new URL('https://bluo.app'),
  title: 'Bluo — Find your people',
  description: 'See who is nearby, find your free friends and stay connected at college.',
  applicationName: 'Bluo',
  manifest: '/manifest.webmanifest',
  alternates: { canonical: 'https://bluo.app' },
};

export const viewport: Viewport = { themeColor: '#0b74ff', width: 'device-width', initialScale: 1, maximumScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<AuthGate /><ProductionTools /></body></html>;
}
