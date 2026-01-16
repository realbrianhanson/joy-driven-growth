import { motion, Variants, Transition } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const easing = [0.25, 0.46, 0.45, 0.94] as const;

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
};

const pageTransition: Transition = {
  duration: 0.3,
  ease: easing,
};

const childVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
};

export const PageTransition = ({ children, className }: PageTransitionProps) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerChild = ({ children, className }: PageTransitionProps) => {
  return (
    <motion.div variants={childVariants} className={className}>
      {children}
    </motion.div>
  );
};

export const FadeIn = ({ 
  children, 
  className,
  delay = 0 
}: PageTransitionProps & { delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: easing }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ScaleIn = ({ 
  children, 
  className,
  delay = 0 
}: PageTransitionProps & { delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: easing }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const SlideInRight = ({ 
  children, 
  className,
  delay = 0 
}: PageTransitionProps & { delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay, ease: easing }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export { pageVariants, childVariants };
