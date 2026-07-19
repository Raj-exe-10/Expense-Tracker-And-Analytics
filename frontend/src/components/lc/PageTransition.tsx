import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Shared page-entrance animation: fade + slight slide-up, ~300ms.
 * Skips the animation entirely when the user prefers reduced motion.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
};
