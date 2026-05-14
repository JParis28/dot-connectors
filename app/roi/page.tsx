import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RoiPage } from "./RoiPage";

const TITLE = "Recoverable Revenue Calculator · Connectors";
const DESCRIPTION =
  "What your front office is costing you, in three real numbers. Drop in your trade and a few honest figures. We'll show you the revenue leaking out the front of your business, with gross profit underneath.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Connectors Recoverable Revenue Calculator",
  description:
    "Free interactive ROI calculator for HVAC, roofing, and home-services contractors. Quantifies recoverable revenue (and underlying gross profit) from missed calls, slow lead response, plan attach, and past-customer reactivation.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  url: "https://www.getconnectors.ai/roi",
};

export default function RoiRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav back light />
      <RoiPage />
      <Footer />
    </>
  );
}
