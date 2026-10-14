"use client";

import { useEffect, useRef } from "react";

type SonarGridProps = {
  className?: string;
};

type Ping = {
  x: number;
  y: number;
  start: number;
  duration: number;
  radius: number;
};

export function SonarGrid({ className = "" }: SonarGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !host || !context) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pings: Ping[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastFrame = 0;
    let lastAmbientPing = 0;
    let visible = true;
    let pageVisible = !document.hidden;

    const addPing = (x: number, y: number, now: number) => {
      pings.push({ x, y, start: now, duration: reducedMotion ? 800 : 1900, radius: Math.max(width, height) * 0.48 });
      if (pings.length > 5) pings.shift();
    };

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const onPointerDown = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      addPing(event.clientX - bounds.left, event.clientY - bounds.top, performance.now());
    };
    const onVisibilityChange = () => { pageVisible = !document.hidden; };

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (!visible || !pageVisible || now - lastFrame < (reducedMotion ? 1000 : 32)) return;
      lastFrame = now;

      if (!reducedMotion && now - lastAmbientPing > 3600 && pings.length < 2) {
        lastAmbientPing = now;
        addPing(width * (0.25 + Math.random() * 0.5), height * (0.25 + Math.random() * 0.5), now);
      }

      context.clearRect(0, 0, width, height);
      const spacing = 34;
      for (let y = 16; y < height; y += spacing) {
        for (let x = 16; x < width; x += spacing) {
          let glow = 0;
          for (const ping of pings) {
            const elapsed = (now - ping.start) / ping.duration;
            const distance = Math.hypot(x - ping.x, y - ping.y);
            const waveDistance = elapsed * ping.radius;
            const strength = Math.max(0, 1 - Math.abs(distance - waveDistance) / 74) * (1 - elapsed);
            glow = Math.max(glow, strength);
          }
          context.beginPath();
          context.arc(x, y, 1.1 + glow * 1.7, 0, Math.PI * 2);
          context.fillStyle = `rgba(218, 255, 126, ${0.18 + glow * 0.76})`;
          context.fill();
        }
      }

      for (let index = pings.length - 1; index >= 0; index -= 1) {
        const ping = pings[index];
        const elapsed = (now - ping.start) / ping.duration;
        if (elapsed >= 1) {
          pings.splice(index, 1);
          continue;
        }
        const radius = elapsed * ping.radius;
        context.beginPath();
        context.arc(ping.x, ping.y, radius, 0, Math.PI * 2);
        context.strokeStyle = `rgba(218, 255, 126, ${(1 - elapsed) * 0.38})`;
        context.lineWidth = 1;
        context.stroke();
      }
    };

    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(host);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    canvas.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("visibilitychange", onVisibilityChange);
    resize();
    addPing(width * 0.7, height * 0.48, performance.now() - 1200);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div ref={hostRef} aria-hidden="true" className={`sonar-grid ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}
