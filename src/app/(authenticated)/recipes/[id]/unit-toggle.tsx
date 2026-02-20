"use client";

import { useState, useEffect } from "react";
import type { UnitSystem } from "@/lib/unit-conversion";

export function useUnitSystem(): [UnitSystem, (s: UnitSystem) => void] {
  const [system, setSystem] = useState<UnitSystem>("metric");

  useEffect(() => {
    const stored = document.cookie
      .split("; ")
      .find((c) => c.startsWith("unit_system="))
      ?.split("=")[1];
    if (stored === "imperial" || stored === "metric") {
      setSystem(stored);
    }
  }, []);

  function update(s: UnitSystem) {
    setSystem(s);
    document.cookie = `unit_system=${s}; path=/; max-age=${60 * 60 * 24 * 365}`;
  }

  return [system, update];
}

export function UnitToggle({
  system,
  onChange,
}: {
  system: UnitSystem;
  onChange: (s: UnitSystem) => void;
}) {
  return (
    <div className="inline-flex font-mono text-[9px] uppercase tracking-[0.06em]">
      <button
        onClick={() => onChange("metric")}
        className={`px-2 py-0.5 transition-colors ${
          system === "metric"
            ? "bg-ink text-bg"
            : "text-ink-muted hover:text-ink"
        }`}
      >
        Metric
      </button>
      <button
        onClick={() => onChange("imperial")}
        className={`px-2 py-0.5 transition-colors ${
          system === "imperial"
            ? "bg-ink text-bg"
            : "text-ink-muted hover:text-ink"
        }`}
      >
        Imperial
      </button>
    </div>
  );
}
