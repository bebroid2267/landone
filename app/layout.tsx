import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import CheckConsentStatus from '@/components/CheckConsentStatus'
import { UserProvider } from '@/components/hooks/useUser'
import { GoogleAdsProvider } from '@/components/hooks/useGoogleAds'
import Main from '@/components/ui/Main'
import { ToastProvider } from '@/components/ui/Toast/ToastContext'
import PostHogProvider from '@/components/PostHogProvider'
import '../styles/main.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Taller de Inteligencia Artificial',
  description: 'Taller de Inteligencia Artificial',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const PIXEL_ID = '620620454428902'
  const GA_ID = 'G-QTLQHW6676'

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            background-color: #108da0 !important;
            overflow: hidden !important;
          }
        `}} />
        {/* Meta Pixel Code */}
        <Script id="fb-pixel-base" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>

        {/* Google Analytics (gtag.js) */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body
        className={`${inter.className} antialiased min-h-screen transition-colors duration-300 overflow-hidden`}
        style={{ backgroundColor: '#108da0' }}
      >
        <div className="relative z-10">
          <UserProvider>
            <GoogleAdsProvider>
              <ToastProvider>
                <PostHogProvider>
                  <Main>{children}</Main>
                  <CheckConsentStatus />
                </PostHogProvider>
              </ToastProvider>
            </GoogleAdsProvider>
          </UserProvider>
        </div>
      </body>
    </html>
  )
}
