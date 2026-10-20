import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { config, abs } from '@/lib/config';
import { siteDefaults } from '@/lib/format';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnnouncementBar from '@/components/AnnouncementBar';
import './globals.css';

export const metadata: Metadata = siteDefaults() as Metadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7916ff' },
    { media: '(prefers-color-scheme: dark)', color: '#171129' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const problems = config.isProd ? [] : [];
  void problems;

  return (
    <html lang="en-IN">
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        <AnnouncementBar />
        <Header />

        <main id="main" className="flex-1">
          {children}
        </main>

        <Footer />

        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationJsonLd(), websiteJsonLd()]),
          }}
        />

        {config.site.gaId ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${config.site.gaId}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${config.site.gaId}', { page_path: window.location.pathname });
            `}</Script>
          </>
        ) : null}

        <Script id="sp-boot" strategy="afterInteractive">{`
          // lightweight conversion + event tracking hook (works with or without GA)
          window.spTrack = function(name, data){
            try {
              if (window.gtag) window.gtag('event', name, data || {});
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({ event: name, ...(data || {}) });
            } catch (e) {}
          };
        `}</Script>
      </body>
    </html>
  );
}
