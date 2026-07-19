import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600', '800'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'SecHub - Nền tảng Học Pentest Web',
  description: 'Học khai thác lỗ hổng bảo mật web qua tài liệu lý thuyết và bài lab thực hành tương tác. SQL Injection, XSS, CSRF, và nhiều hơn nữa.',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
  other: {
    'color-scheme': 'light only',
    'supported-color-schemes': 'light only',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={beVietnamPro.variable} suppressHydrationWarning data-scroll-behavior="smooth" style={{ colorScheme: 'light' }}>
      <head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
      </head>
      <body style={{ fontFamily: 'var(--font-sans), sans-serif', backgroundColor: '#FAF6F0', color: '#6B5C4A' }}>
        <AuthProvider>
          <LanguageProvider>
            <AppShell>{children}</AppShell>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
