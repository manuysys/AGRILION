import { Variants, Transition } from "framer-motion";

export const getReducedMotion = (): boolean =>
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

export const reducedMotion = typeof window !== "undefined"
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
  : false;

export const defaultTransition: Transition = {
  duration: 0.5,
  ease: [0.25, 0.1, 0.25, 1],
};

export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, ...defaultTransition },
  }),
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: defaultTransition },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: defaultTransition },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: defaultTransition },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const cardHover = {
  rest: { scale: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  hover: {
    scale: 1.02,
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
    transition: { type: "spring" as const, stiffness: 400, damping: 25 },
  },
};

export const tabIndicatorVariants: Variants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: {
    scaleX: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 500, damping: 30 },
  },
  exit: { scaleX: 0, opacity: 0 },
};

export const countUpValue = (
  end: number,
  duration = 1.5
): { initial: number; animate: number; transition: Transition } => ({
  initial: 0,
  animate: end,
  transition: { duration, ease: [0.25, 0.1, 0.25, 1] },
});

export const sidebarVariants: Variants = {
  open: {
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  closed: {
    x: "-100%",
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

export const scaleOnClick = {
  whileTap: { scale: 0.97 },
  whileHover: { scale: 1.03 },
};

export const chatBubble: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: defaultTransition },
  exit: { opacity: 0, y: -8, scale: 0.95, transition: { duration: 0.2 } },
};
