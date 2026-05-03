import { useCallback, useEffect, useRef } from 'react';
import { Leaf } from '../lib/leafParticle';

export function useLeafSystem() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Leaf[]>([]);
  const rafRef = useRef<number | null>(null);

  const burst = useCallback(
    (x: number, y: number) => {
      const count = 11 + Math.floor(Math.random() * 7);
      const runFrame = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particlesRef.current = particlesRef.current.filter((particle) => !particle.isDead());
        particlesRef.current.forEach((particle) => {
          particle.update();
          particle.draw(ctx);
        });

        if (particlesRef.current.length > 0) {
          rafRef.current = requestAnimationFrame(runFrame);
        } else {
          rafRef.current = null;
        }
      };

      for (let index = 0; index < count; index += 1) {
        window.setTimeout(() => {
          particlesRef.current.push(new Leaf(x, y));
          if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(runFrame);
          }
        }, index * 18);
      }
    },
    [],
  );

  const resize = useCallback((width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { canvasRef, burst, resize };
}
