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
    <div className="inline-flex rounded-md bg-warm-tag text-sm">
      <button
        onClick={() => onChange("metric")}
        className={`px-3 py-1 rounded-l-md ${system === "metric" ? "bg-accent text-white" : "text-warm-gray hover:bg-warm-tag"}`}
      >
        Metric
      </button>
      <button
        onClick={() => onChange("imperial")}
        className={`px-3 py-1 rounded-r-md ${system === "imperial" ? "bg-accent text-white" : "text-warm-gray hover:bg-warm-tag"}`}
      >
        Imperial
      </button>
    </div>
  );
}
