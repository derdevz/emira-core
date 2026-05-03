import { useRef, useCallback } from 'react';
import { Leaf } from '../utils/leafParticle';

export function useLeafSystem() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Leaf[]>([]);
  const rafRef = useRef<number | null>(null);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particlesRef.current = particlesRef.current.filter((p) => !p.isDead());
    particlesRef.current.forEach((p) => {
      p.update();
      p.draw(ctx);
    });

    if (particlesRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(loop);
    } else {
      rafRef.current = null;
    }
  }, []);

  const burst = useCallback(
    (clickX: number, clickY: number) => {
      const count = 11 + Math.floor(Math.random() * 7);

      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          particlesRef.current.push(new Leaf(clickX, clickY));
          if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(loop);
          }
        }, i * 18);
      }
    },
    [loop]
  );

  return { canvasRef, burst };
}
