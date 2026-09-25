import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ",
        className
      )}
    >
      {children}
    </div>
  );
};

import { MouseSpotlight } from "@/components/ui/mouse-spotlight";

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "row-span-1 rounded-3xl group/bento hover:shadow-xl transition duration-500 shadow-input dark:shadow-none p-6 glass-dark border border-white/5 bg-zinc-950/80 justify-between flex flex-col space-y-4 relative overflow-hidden",
        className
      )}
    >
      <MouseSpotlight />
      <div className="relative z-10">
        {header}
      </div>
      <div className="group-hover/bento:translate-x-2 transition duration-200 relative z-10">
        {icon}
        <div className="font-bold text-white mb-2 mt-2 tracking-tight text-xl">
          {title}
        </div>
        <div className="font-normal text-zinc-400 text-sm leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  );
};
