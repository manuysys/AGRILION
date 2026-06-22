'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const Meteors = ({
  number,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const [meteors, setMeteors] = useState<
    { id: number; left: string; delay: string; duration: string }[]
  >([]);

  useEffect(() => {
    const meteorsArr = new Array(number || 20).fill(true).map((_, idx) => ({
      id: idx,
      left: Math.floor(Math.random() * (400 - -400) + -400) + 'px',
      delay: Math.random() * (0.8 - 0.2) + 0.2 + 's',
      duration: Math.floor(Math.random() * (10 - 2) + 2) + 's',
    }));
    setMeteors(meteorsArr);
  }, [number]);

  return (
    <>
      {meteors.map((el) => (
        <motion.span
          key={el.id}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            x: 500,
            y: 500,
          }}
          transition={{
            duration: parseFloat(el.duration),
            delay: parseFloat(el.delay),
            repeat: Infinity,
            ease: 'linear',
          }}
          className={`animate-meteor-effect absolute top-1/2 left-1/2 h-[0.1rem] w-[0.1rem] rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg] ${className}`}
          style={{
            top: 0,
            left: el.left,
          }}
        >
          {/* Meteor Tail */}
          <div className="pointer-events-none absolute top-1/2 -z-10 h-[1px] w-[50px] -translate-y-1/2 bg-gradient-to-r from-slate-500 to-transparent" />
        </motion.span>
      ))}
    </>
  );
};
