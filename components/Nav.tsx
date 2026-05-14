"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";
import { Icon } from "./Icon";

type NavProps = {
  back?: boolean;
  light?: boolean;
};

export function Nav({ back = false, light = false }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`nav ${scrolled ? "nav--scrolled" : ""} ${light ? "nav--light" : ""}`}>
      <div className="nav__inner">
        <a href={back ? "/" : "#top"} className="nav__logo">
          <BrandMark />
          <span>Connectors</span>
        </a>
        {back ? (
          <a href="/" className="btn btn--nav btn--nav-back">
            <Icon name="arrow-left" size={14} strokeWidth={2} />
            Back
          </a>
        ) : (
          <a href="/start" className="btn btn--nav">Book a Call</a>
        )}
      </div>
    </nav>
  );
}
