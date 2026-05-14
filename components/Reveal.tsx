"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealTag = "div" | "section" | "header" | "footer" | "li";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: RevealTag;
};

export function Reveal({ children, delay = 0, className = "", as = "div" }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // Hard fallback: if IntersectionObserver hasn't fired by 600ms, force visible.
    // This caught a real bug in the prototype where Demo never revealed on slow CPU.
    const fallback = window.setTimeout(() => setVisible(true), 600);
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
          window.clearTimeout(fallback);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(node);
    return () => {
      obs.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  const Tag = as as "div";
  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`reveal ${visible ? "is-in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
