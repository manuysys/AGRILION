import Image from 'next/image';

interface RiveLogoProps {
  className?: string;
}

export function RiveLogo({ className = "" }: RiveLogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Image
        src="/images/ICONO_AGRILION_FINAL.png"
        alt="Agrilion Logo"
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-contain"
        priority
      />
    </div>
  );
}
