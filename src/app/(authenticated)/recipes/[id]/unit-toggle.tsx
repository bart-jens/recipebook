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
    <div className="inline-flex rounded-md border border-gray-200 text-sm">
      <button
        onClick={() => onChange("metric")}
        className={`px-3 py-1 rounded-l-md ${system === "metric" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
      >
        Metric
      </button>
      <button
        onClick={() => onChange("imperial")}
        className={`px-3 py-1 rounded-r-md ${system === "imperial" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
      >
        Imperial
      </button>
    </div>
  );
}
