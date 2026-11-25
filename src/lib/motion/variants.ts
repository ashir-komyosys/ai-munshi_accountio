import type { Variants } from "motion/react";
import { MOTION_DISTANCES, MOTION_DURATIONS, MOTION_EASINGS } from "./tokens";

export const pageVariants: Variants = {
  initial: { opacity: 0, y: MOTION_DISTANCES.pageY },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.standard },
  },
};

export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: MOTION_DISTANCES.staggerDelay,
    },
  },
};

export const cardItemVariants: Variants = {
  initial: { opacity: 0, y: MOTION_DISTANCES.cardY },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_DURATIONS.base, ease: MOTION_EASINGS.standard },
  },
};

export const dropdownVariants: Variants = {
  initial: { opacity: 0, y: -MOTION_DISTANCES.dropdownY, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.standard },
  },
  exit: {
    opacity: 0,
    y: -MOTION_DISTANCES.dropdownY,
    scale: 0.97,
    transition: { duration: MOTION_DURATIONS.instant, ease: MOTION_EASINGS.exit },
  },
};

export const modalOverlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: MOTION_DURATIONS.fast } },
  exit: { opacity: 0, transition: { duration: MOTION_DURATIONS.instant } },
};

export const modalContentVariants: Variants = {
  initial: { opacity: 0, scale: 0.97, y: MOTION_DISTANCES.modalY },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: MOTION_DURATIONS.base, ease: MOTION_EASINGS.standard },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: MOTION_DISTANCES.modalY,
    transition: { duration: MOTION_DURATIONS.instant, ease: MOTION_EASINGS.exit },
  },
};

export const messageVariants: Variants = {
  initial: { opacity: 0, y: MOTION_DISTANCES.messageY, scale: 0.99 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.standard },
  },
};

export const emptyStateVariants: Variants = {
  initial: { opacity: 0, scale: 0.98, y: 6 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: MOTION_DURATIONS.base, ease: MOTION_EASINGS.standard },
  },
};
