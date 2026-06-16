"use client";

import { useSyncExternalStore, ReactNode } from "react";

interface Props {
  render: () => ReactNode;
  height?: string;
}

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function ClientChart({ render, height = "h-48" }: Props) {
  const mounted = useMounted();

  if (!mounted) {
    return <div className={`${height} bg-gray-50 rounded-xl animate-pulse`} />;
  }

  return <div className={`${height} min-h-0`}>{render()}</div>;
}
