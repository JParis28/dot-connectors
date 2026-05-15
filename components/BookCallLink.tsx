"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
};

export function BookCallLink({ children, onClick, ...rest }: Props) {
  const router = useRouter();

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const s = params.get("s");
      if (!s) return;
      e.preventDefault();
      router.push(`/start?s=${encodeURIComponent(s)}`);
    },
    [onClick, router],
  );

  return (
    <a {...rest} href="/start" onClick={handleClick}>
      {children}
    </a>
  );
}
