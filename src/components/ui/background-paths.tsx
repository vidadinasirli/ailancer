import { useMemo } from 'react';
import { motion } from 'framer-motion';

function FloatingPaths({ position }: { position: number }) {
  const paths = useMemo(
    () => Array.from({ length: 36 }, (_, i) => ({
      id: i,
      d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
        380 - i * 5 * position
      } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
        152 - i * 5 * position
      } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
        684 - i * 5 * position
      } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
      width: 0.5 + i * 0.03,
      duration: 20 + (i % 10),
    })),
    [position],
  );

  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="-520 -430 1420 1330" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
      {paths.map((path) => (
        <motion.path
          key={path.id}
          d={path.d}
          stroke="currentColor"
          strokeWidth={path.width}
          strokeOpacity={0.42 + path.id * 0.016}
          initial={{ pathLength: 0.3, opacity: 0.7 }}
          animate={{
            pathLength: 1,
            opacity: [0.55, 0.9, 0.55],
            pathOffset: [0, 1, 0],
          }}
          transition={{
            duration: path.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'linear',
          }}
        />
      ))}
    </svg>
  );
}

export function BackgroundPaths() {
  return (
    <div
      className="ai-background-paths pointer-events-none absolute inset-0 overflow-hidden text-sky-100/80"
      aria-hidden="true"
    >
      <FloatingPaths position={1} />
      <FloatingPaths position={-1} />
    </div>
  );
}
