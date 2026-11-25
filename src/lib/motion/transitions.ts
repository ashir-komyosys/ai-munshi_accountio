import type { Transition } from "motion/react";
import { MOTION_DURATIONS, MOTION_EASINGS, MOTION_SPRINGS } from "./tokens";

export const pageTransition: Transition = {
  duration: MOTION_DURATIONS.fast,
  ease: MOTION_EASINGS.standard,
};

export const cardTransition: Transition = {
  duration: MOTION_DURATIONS.base,
  ease: MOTION_EASINGS.standard,
};

export const dropdownTransition: Transition = {
  duration: MOTION_DURATIONS.fast,
  ease: MOTION_EASINGS.standard,
};

export const modalTransition: Transition = {
  duration: MOTION_DURATIONS.base,
  ease: MOTION_EASINGS.standard,
};

export const indicatorTransition: Transition = MOTION_SPRINGS.indicator;
export const snappySpring: Transition = MOTION_SPRINGS.snappy;
export const drawerSpring: Transition = MOTION_SPRINGS.drawer;
