import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

export const HeartAnimation = () => {
  const [hearts, setHearts] = useState<{ id: number; x: number; delay: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      
      const newHeart = {
        id: Math.random(),
        x: Math.random() * 100, 
        delay: Math.random() * 0.5, 
      };
      setHearts((prev) => [...prev, newHeart]);

      setTimeout(() => {
        setHearts((prev) => prev.filter((heart) => heart.id !== newHeart.id));
      }, 20000);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          className="absolute text-red-500"
          style={{ left: `${heart.x}%`, bottom: '0%' }}
          initial={{ opacity: 0, y: 0, scale: 1 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: -300, 
            scale: [1, 0.5, 1.5, 0.5],
            x: (Math.random() - 0.5) * 100,
          }}
          transition={{
            duration: 3,
            ease: 'easeOut',
            delay: heart.delay,
            times: [0, 0.2, 0.8, 1],
          }}
        >
          <Heart className="h-6 w-6 fill-red-500" />
        </motion.div>
      ))}
    </div>
  );
};