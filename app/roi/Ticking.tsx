"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  className?: string;
};

export function TickingValue({ value, className }: Props) {
  const [bumpKey, setBumpKey] = useState(0);
  const last = useRef(value);
  useEffect(() => {
    if (last.current !== value) {
      setBumpKey((k) => k + 1);
      last.current = value;
    }
  }, [value]);
  return (
    <span key={bumpKey} className={`rc-tick ${className ?? ""}`}>
      {value}
    </span>
  );
}
