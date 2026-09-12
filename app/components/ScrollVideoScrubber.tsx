"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

const TOTAL_FRAMES = 100;

interface HeroScrollyCartProps {
  onScrollProgress?: (progress: number) => void;
}

export function ScrollVideoScrubber({ onScrollProgress }: HeroScrollyCartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const currentFrameRef = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  // 1. Preload 100 frames into browser memory
  useEffect(() => {
    const images: HTMLImageElement[] = [];
    let loaded = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, "0");
      img.src = `/frames/frame_${frameNum}.jpg`;
      img.onload = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded === 1 && canvasRef.current) {
          drawFrame(0);
        }
      };
      images.push(img);
    }
    imagesRef.current = images;

    return () => {
      imagesRef.current = [];
    };
  }, []);

  // 2. Hardware-accelerated Canvas render
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imagesRef.current[frameIndex];
    if (img && img.complete) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      currentFrameRef.current = frameIndex;
    }
  }, []);

  // 3. Scroll synchronization
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const scrollProgress = Math.min(
        1,
        Math.max(0, -rect.top / (rect.height - windowHeight * 0.3 || 1))
      );

      const targetFrame = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.floor(scrollProgress * (TOTAL_FRAMES - 1)))
      );

      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      animationFrameId.current = requestAnimationFrame(() => {
        drawFrame(targetFrame);
        if (onScrollProgress) onScrollProgress(scrollProgress);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [drawFrame, onScrollProgress]);

  // 4. Mouse wheel scrubbing
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY > 0 ? 1 : -1;
    const nextFrame = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, currentFrameRef.current + delta * 2)
    );
    drawFrame(nextFrame);
  };

  const progressPercent = Math.round(((currentFrameRef.current + 1) / TOTAL_FRAMES) * 100);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] flex items-center justify-center overflow-hidden select-none bg-[#090a0f]"
    >
      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        className="w-full h-full object-cover pointer-events-none opacity-85"
      />

      {/* Solid dark scrims without gradients */}
      <div className="absolute inset-0 bg-[#090a0f]/40 pointer-events-none" />

      {/* Loading state indicator */}
      {loadedCount < TOTAL_FRAMES && (
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 text-[11px] text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>Loading simulation ({loadedCount}%)...</span>
        </div>
      )}

      {/* Flat minimal top status */}
      <div className="absolute top-4 left-6 z-10 pointer-events-none">
        <span className="text-xs font-mono tracking-wider uppercase text-zinc-400 bg-zinc-900/90 px-3 py-1 rounded-full">
          Cart Simulation
        </span>
      </div>

      <div className="absolute top-4 right-6 z-10 pointer-events-none hidden sm:block">
        <span className="text-xs text-zinc-400 bg-zinc-900/90 px-3 py-1 rounded-full">
          Scroll down to advance
        </span>
      </div>

      {/* Flat progress bar at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-zinc-800 pointer-events-none">
        <div
          className="h-full bg-blue-600 transition-all duration-75"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
