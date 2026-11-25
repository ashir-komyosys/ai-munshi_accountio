export const MOTION_DURATIONS = {
  instant: 0.12,
  fast: 0.16,
  base: 0.22,
  slow: 0.3,
  number: 0.45,
  chart: 0.55,
} as const;

export const MOTION_EASINGS = {
  standard: [0.22, 1, 0.36, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
};

export const MOTION_SPRINGS = {
  snappy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 35,
    mass: 0.8,
  },
  indicator: {
    type: "spring" as const,
    stiffness: 440,
    damping: 36,
    mass: 0.75,
  },
  gentle: {
    type: "spring" as const,
    stiffness: 320,
    damping: 32,
    mass: 0.9,
  },
  drawer: {
    type: "spring" as const,
    stiffness: 380,
    damping: 36,
    mass: 0.85,
  },
};

export const MOTION_DISTANCES = {
  pageY: 6,
  cardY: 8,
  dropdownY: 4,
  modalY: 8,
  messageY: 8,
  hoverY: -2,
  pressScale: 0.98,
  staggerDelay: 0.04,
} as const;
