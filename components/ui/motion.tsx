'use client';

import * as React from 'react';
import { motion, HTMLMotionProps, Variants, Transition } from 'framer-motion';
import { cn } from '@/lib/utils';

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 25
};

export const softSpringTransition: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 20
};

export interface FadeInProps extends HTMLMotionProps<'div'> {
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  duration?: number;
}

export function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  distance = 16,
  duration = 0.35,
  className,
  ...props
}: FadeInProps) {
  const directionOffset = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionOffset[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...directionOffset[direction] }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export interface ScaleInProps extends HTMLMotionProps<'div'> {
  delay?: number;
  scale?: number;
}

export function ScaleIn({ children, delay = 0, scale = 0.94, className, ...props }: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale }}
      transition={{ ...softSpringTransition, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  staggerDelay = 0.06,
  className,
  ...props
}: HTMLMotionProps<'div'> & { staggerDelay?: number }) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...props }: HTMLMotionProps<'div'>) {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: springTransition }
  };

  return (
    <motion.div variants={itemVariants} className={className} {...props}>
      {children}
    </motion.div>
  );
}

export function HoverCard({ children, className, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={springTransition}
      className={cn('cursor-pointer', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionPress({ children, className, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      transition={springTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
