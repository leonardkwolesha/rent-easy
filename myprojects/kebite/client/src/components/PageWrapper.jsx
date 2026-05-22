import { motion } from 'framer-motion';
import { pageTransition } from '../animations/variants';

export default function PageWrapper({ children, style = {} }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      style={{ minHeight: '100vh', ...style }}
    >
      {children}
    </motion.div>
  );
}
