import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Offer } from "@/components/Offer";
import { Proof } from "@/components/Proof";
import { Demo } from "@/components/Demo";
import { CTABookCall } from "@/components/CTABookCall";
import { Footer } from "@/components/Footer";
import { RoiPage } from "./roi/RoiPage";

export default function Page() {
  return (
    <div data-hero-variant="split">
      <Nav />
      <Hero />
      <RoiPage embedded />
      <Offer />
      <Proof />
      <Demo />
      <CTABookCall />
      <Footer />
    </div>
  );
}
