"use client";

import { useState, useEffect } from "react";
import { FlaskConical } from "lucide-react";

export default function DemoBadge() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  if (!hydrated || process.env.NEXT_PUBLIC_MOCK_MODE !== "true") return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
      <FlaskConical size={10} />
      DEMO
    </span>
  );
}
