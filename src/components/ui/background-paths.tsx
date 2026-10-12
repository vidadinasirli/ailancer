import { useMemo } from 'react';

function FloatingPaths({ position }: { position: number }) {
  const paths = useMemo(
    () => Array.from({ length: 24 }, (_, i) => ({
      id: i,
      d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
        380 - i * 5 * position
      } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
        152 - i * 5 * position
      } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
        684 - i * 5 * position
      } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
      width: 0.5 + i * 0.03,
    })),
    [position],
  );

  return (
    <svg className="ai-background-path-layer absolute inset-0 h-full w-full" viewBox="-520 -430 1420 1330" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
      <g>
        {paths.map((path) => (
          <path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.2 + path.id * 0.01}
          />
        ))}
      </g>
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
