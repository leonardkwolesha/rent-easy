import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const EMOJIS = ['🍔', '🍕', '🍛', '🥘', '🛵', '🥟'];
const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f8f8',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Floating food emojis */}
      {EMOJIS.map((emoji, i) => (
        <motion.span
          key={i}
          style={{
            position: 'absolute',
            fontSize: '2.5rem',
            left: `${10 + i * 15}%`,
            top: `${15 + (i % 3) * 25}%`,
            pointerEvents: 'none',
            userSelect: 'none',
            willChange: 'transform',
          }}
          animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
        >
          {emoji}
        </motion.span>
      ))}

      {/* 404 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          fontSize: 'clamp(6rem, 20vw, 10rem)',
          fontWeight: 900,
          lineHeight: 1,
          background: GRADIENT,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem',
        }}
      >
        404
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{ fontWeight: 800, fontSize: '1.5rem', color: '#1a1a2e', marginBottom: '0.5rem' }}
      >
        Oops! Page not found
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{ color: '#888', fontSize: '1rem', marginBottom: '2rem', maxWidth: '340px', lineHeight: 1.6 }}
      >
        Looks like this page took a wrong turn. Let's get you back to the food!
      </motion.p>

      <motion.button
        onClick={() => navigate('/')}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(230,57,70,0.4)' }}
        whileTap={{ scale: 0.97 }}
        style={{
          background: GRADIENT,
          color: '#fff',
          border: 'none',
          borderRadius: '999px',
          padding: '0.85rem 2.25rem',
          fontWeight: 700,
          fontSize: '1rem',
          cursor: 'pointer',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        Back to Home 🏠
      </motion.button>
    </div>
  );
}
