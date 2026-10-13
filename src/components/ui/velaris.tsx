"use client";

import { useEffect, useMemo, useRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const vertexShaderGLSL = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderGLSL = `
precision highp float;
varying vec2 vUv;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_grain;
uniform vec3 u_colors[4];
uniform vec3 u_bg;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  float ratio = u_resolution.x / u_resolution.y;
  vec2 p = uv - 0.5;
  p.x *= ratio;

  float t = u_time * 0.1;

  float n1 = snoise(p * 0.4 + vec2(t * 0.2, -t * 0.3));
  float n2 = snoise(p * 0.55 + vec2(-t * 0.15, t * 0.25) + n1 * 0.25);
  float n3 = snoise(p * 0.75 + vec2(t * 0.1, -t * 0.2) + n2 * 0.2);

  vec3 col = u_bg;
  float dist = length(p) * 1.5;
  float vignette = 1.0 - smoothstep(0.3, 1.2, dist);

  col = mix(col, u_colors[0], smoothstep(-0.2, 0.5, n1) * 0.85);
  col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.7);
  col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.6);
  col = mix(col, u_colors[3], smoothstep(0.0, 0.7, n1 * n2) * 0.5);

  float glow = smoothstep(0.8, 0.0, dist) * 0.3;
  col += u_colors[1] * glow;
  col = mix(col * 0.2, col, vignette);

  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time);
  col += (grain - 0.5) * u_grain * 0.1;

  gl_FragColor = vec4(col, 1.0);
}
`;

const DEFAULT_COLORS = ["#86efac", "#4ade80", "#059669", "#000000"];

export interface VelarisProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  bg?: string;
  colors?: readonly string[];
  speed?: number;
  grain?: number;
  height?: string;
  children?: ReactNode;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  if (!/^[\da-f]{6}$/i.test(value)) return [0, 0, 0];
  return [
    Number.parseInt(value.slice(0, 2), 16) / 255,
    Number.parseInt(value.slice(2, 4), 16) / 255,
    Number.parseInt(value.slice(4, 6), 16) / 255,
  ];
}

const Velaris = ({
  bg = "#000000",
  colors = DEFAULT_COLORS,
  speed = 2,
  grain = 0.3,
  height = "100vh",
  className,
  children,
  style,
  ...props
}: VelarisProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const colorKey = colors.join(",");
  const rgbColors = useMemo(() => {
    const palette = colorKey.split(",");
    return Array.from({ length: 4 }, (_, index) => hexToRgb(palette[index] || DEFAULT_COLORS[index]));
  }, [colorKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;
    canvas.style.visibility = "hidden";

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
    if (!gl) {
      console.warn("Velaris WebGL is unavailable; the CSS background fallback will be used.");
      return undefined;
    }

    const shaders: WebGLShader[] = [];
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let raf = 0;
    let lastFrame = 0;
    let currentTime = 0;
    let inViewport = true;
    let pageVisible = !document.hidden;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Could not create a Velaris WebGL shader.");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader) || "Unknown shader compilation error.";
        gl.deleteShader(shader);
        throw new Error(message);
      }
      shaders.push(shader);
      return shader;
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    try {
      program = gl.createProgram();
      if (!program) throw new Error("Could not create a Velaris WebGL program.");
      gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexShaderGLSL));
      gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentShaderGLSL));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || "Unknown shader linking error.");
      }
      gl.useProgram(program);

      buffer = gl.createBuffer();
      if (!buffer) throw new Error("Could not create a Velaris WebGL buffer.");
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

      const position = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      const uniforms = {
        resolution: gl.getUniformLocation(program, "u_resolution"),
        time: gl.getUniformLocation(program, "u_time"),
        grain: gl.getUniformLocation(program, "u_grain"),
        colors: gl.getUniformLocation(program, "u_colors[0]"),
        background: gl.getUniformLocation(program, "u_bg"),
      };

      if (Object.values(uniforms).some((uniform) => uniform === null)) {
        throw new Error("A required Velaris WebGL uniform was not found.");
      }

      const draw = (time: number) => {
        currentTime = time;
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.uniform1f(uniforms.time, time * 0.001 * speed);
        gl.uniform1f(uniforms.grain, grain);
        gl.uniform3fv(uniforms.colors, new Float32Array(rgbColors.flat()));
        gl.uniform3fv(uniforms.background, new Float32Array(hexToRgb(bg)));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        canvas.style.visibility = "visible";
      };

      const frame = (time: number) => {
        if (time - lastFrame >= 1000 / 30) {
          draw(time);
          lastFrame = time;
        }
        raf = requestAnimationFrame(frame);
      };

      const updateAnimation = () => {
        stop();
        if (!inViewport || !pageVisible) return;
        if (motionPreference.matches) {
          draw(currentTime);
          return;
        }
        raf = requestAnimationFrame(frame);
      };

      const resize = () => {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
        const width = Math.max(1, Math.round(container.clientWidth * pixelRatio));
        const heightPx = Math.max(1, Math.round(container.clientHeight * pixelRatio));
        if (canvas.width !== width || canvas.height !== heightPx) {
          canvas.width = width;
          canvas.height = heightPx;
          gl.viewport(0, 0, width, heightPx);
          draw(currentTime);
        }
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);

      const intersectionObserver = new IntersectionObserver(([entry]) => {
        inViewport = entry.isIntersecting;
        updateAnimation();
      });
      intersectionObserver.observe(container);

      const onVisibilityChange = () => {
        pageVisible = !document.hidden;
        updateAnimation();
      };
      const onMotionChange = () => updateAnimation();

      document.addEventListener("visibilitychange", onVisibilityChange);
      motionPreference.addEventListener("change", onMotionChange);
      resize();
      updateAnimation();

      return () => {
        stop();
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
        document.removeEventListener("visibilitychange", onVisibilityChange);
        motionPreference.removeEventListener("change", onMotionChange);
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
        shaders.forEach((shader) => gl.deleteShader(shader));
      };
    } catch (error) {
      console.error("Velaris WebGL setup failed; the CSS background fallback will be used.", error);
      canvas.style.visibility = "hidden";
      stop();
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      shaders.forEach((shader) => gl.deleteShader(shader));
      return undefined;
    }
  }, [bg, grain, rgbColors, speed]);

  return (
    <div
      ref={containerRef}
      style={{ ...style, height }}
      className={cn("relative w-full overflow-hidden", className)}
      {...props}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
};

export default Velaris;
