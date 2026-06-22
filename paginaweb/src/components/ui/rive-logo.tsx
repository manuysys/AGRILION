'use client';

import { useRive } from '@rive-app/react-canvas';

export function RiveLogo({ className }: { className?: string }) {
  const { RiveComponent } = useRive({
    // Fallback to a community Rive file just to demonstrate integration
    src: 'https://public.rive.app/community/runtime-files/3847-8025-glass-morphism.riv',
    autoplay: true,
  });

  return (
    <div className={className}>
      <RiveComponent />
    </div>
  );
}
