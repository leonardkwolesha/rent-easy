export const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' } },
};

export const slideInLeft = {
  hidden:  { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const slideInRight = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 28 } },
};

export const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export const staggerFast = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export const popIn = {
  hidden:  { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1,
    transition: { type: 'spring', stiffness: 600, damping: 22 } },
};

export const cardHover = {
  rest:  { y: 0,
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
    transition: { type: 'spring', stiffness: 400, damping: 30 } },
  hover: { y: -6, scale: 1.02,
    boxShadow: '0 20px 40px rgba(0,0,0,0.14)',
    transition: { type: 'spring', stiffness: 400, damping: 25 } },
};

export const pageTransition = {
  initial:  { opacity: 0, y: 16 },
  animate:  { opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:     { opacity: 0, y: -16,
    transition: { duration: 0.25, ease: 'easeIn' } },
};
