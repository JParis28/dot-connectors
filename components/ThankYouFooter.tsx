import { BrandMark } from "./BrandMark";

export default function ThankYouFooter() {
  return (
    <footer className="thanks__footer">
      <div className="thanks__footer-brand">
        <BrandMark size={20} />
        <span>Connectors</span>
      </div>
      <span className="thanks__footer-built">
        Built in St. Petersburg, FL · © 2026 Connectors AI LLC
      </span>
      <span className="thanks__footer-links">
        <a href="/privacy-policy">Privacy</a>
        <span aria-hidden="true">·</span>
        <a href="/terms-of-use">Terms</a>
      </span>
    </footer>
  );
}
