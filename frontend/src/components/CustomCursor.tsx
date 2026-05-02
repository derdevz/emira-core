import { motion } from 'framer-motion';

interface CustomCursorProps {
  position: { x: number; y: number };
}

export default function CustomCursor({ position }: CustomCursorProps) {
  return (
    <>
      <motion.div
        className="fixed w-3 h-3 rounded-full bg-aurora-mid/80 pointer-events-none z-[9999]"
        animate={{
          x: position.x - 6,
          y: position.y - 6,
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 500,
          mass: 0.5,
        }}
      />
      <motion.div
        className="fixed w-8 h-8 rounded-full border border-aurora-mid/45 pointer-events-none z-[9999]"
        animate={{
          x: position.x - 16,
          y: position.y - 16,
        }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 200,
          mass: 0.8,
        }}
      />
    </>
  );
}
