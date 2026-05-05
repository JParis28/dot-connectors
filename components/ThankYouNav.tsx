import { BrandMark } from "./BrandMark";

export default function ThankYouNav() {
  return (
    <nav className="thanks__nav">
      <a href="https://getconnectors.ai" className="thanks__nav-brand">
        <BrandMark size={26} />
        <span>Connectors</span>
      </a>
      <a href="https://getconnectors.ai" className="thanks__nav-back">
        <span aria-hidden="true">←</span> Back to home
      </a>
    </nav>
  );
}
