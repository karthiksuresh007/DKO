"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type ParticleBurst = {
  id: number;
  x: number;
  y: number;
  points: Array<{ x: number; y: number; delay: number }>;
};

function createPoints() {
  return Array.from({ length: 8 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 8;
    const distance = 18 + Math.random() * 28;

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      delay: index * 0.015
    };
  });
}

export function GlobalClickParticles() {
  const [bursts, setBursts] = useState<ParticleBurst[]>([]);

  useEffect(() => {
    let nextId = 1;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      const burst: ParticleBurst = {
        id: nextId++,
        x: event.clientX,
        y: event.clientY,
        points: createPoints()
      };

      setBursts((current) => [...current, burst]);

      window.setTimeout(() => {
        setBursts((current) => current.filter((item) => item.id !== burst.id));
      }, 700);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      <AnimatePresence>
        {bursts.map((burst) =>
          burst.points.map((point, index) => (
            <motion.div
              key={`${burst.id}-${index}`}
              className="absolute h-1.5 w-1.5 rounded-full bg-[#2E7D32]"
              initial={{ opacity: 0, scale: 0, x: burst.x, y: burst.y }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.4], x: burst.x + point.x, y: burst.y + point.y }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, delay: point.delay, ease: "easeOut" }}
            />
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
