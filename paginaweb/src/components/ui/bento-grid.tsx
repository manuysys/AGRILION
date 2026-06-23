import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
    <motion.div
      className={cn(
        "row-span-1 rounded-3xl group/bento hover:shadow-2xl hover:shadow-emerald-500/20 transition-shadow duration-500 p-6 glass-dark border border-white/5 bg-black/40 justify-between flex flex-col space-y-4 transform perspective-1000",
        className
      )}
      whileHover={{ scale: 1.02, rotateY: 2, rotateX: 2 }}
      animate={{ y: [0, -5, 0] }}
      transition={{ 
        y: { repeat: Infinity, duration: 4 + Math.random() * 2, ease: "easeInOut" }
      }}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {icon}
        <div className="font-bold text-white mb-2 mt-2 tracking-tight text-xl">
          {title}
        </div>
        <div className="font-normal text-zinc-400 text-sm leading-relaxed">
          {description}
        </div>
      </div>
    </motion.div>
  );
};
