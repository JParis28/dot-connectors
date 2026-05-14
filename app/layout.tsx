import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { PageviewTracker } from "@/components/PageviewTracker";
import "./globals.css";

const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const ga4MeasurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "The Phone Always Gets Answered",
  description:
    "An AI front office for HVAC contractors. 95% of your calls answered in 8 seconds. Books the job, texts the customer back. 24/7. Or your money back.",
  openGraph: {
    title: "The Phone Always Gets Answered",
    description:
      "An AI front office for HVAC contractors. 95% of your calls answered in 8 seconds. Books the job, texts the customer back. 24/7. Or your money back.",
    siteName: "Connectors",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Phone Always Gets Answered",
    description:
      "An AI front office for HVAC contractors. 95% of your calls answered in 8 seconds. Books the job, texts the customer back. 24/7. Or your money back.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased text-ink bg-white">
        {children}
        <Suspense fallback={null}>
          <PageviewTracker />
        </Suspense>
        <Analytics />
        {metaPixelId ? (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`!function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');`}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        ) : null}
        {ga4MeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${ga4MeasurementId}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
