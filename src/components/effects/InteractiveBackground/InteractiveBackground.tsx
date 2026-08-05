"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "./InteractiveBackground.module.css";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const MAX_PIXEL_RATIO = 1.5;
const CONNECTION_DISTANCE = 112;

export function InteractiveBackground() {
  const imageLayerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const imageLayer = imageLayerRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });

    if (!imageLayer || !canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let scroll = window.scrollY;
    let targetScroll = scroll;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let particles: Particle[] = [];
    let frameId = 0;
    let isVisible = !document.hidden;

    const createParticles = () => {
      const count = reducedMotion.matches ? 0 : Math.min(coarsePointer.matches ? 28 : 54, Math.floor(width / 20));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        radius: Math.random() * 1.2 + 0.45
      }));
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      createParticles();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reducedMotion.matches) return;
      pointer.targetX = event.clientX / width - 0.5;
      pointer.targetY = event.clientY / height - 0.5;
    };

    const onPointerLeave = () => {
      pointer.targetX = 0;
      pointer.targetY = 0;
    };

    const onScroll = () => {
      targetScroll = window.scrollY;
    };

    const drawParticles = () => {
      context.clearRect(0, 0, width, height);

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        particle.x += particle.vx + pointer.x * 0.06;
        particle.y += particle.vy - 0.035;

        if (particle.x < -8) particle.x = width + 8;
        if (particle.x > width + 8) particle.x = -8;
        if (particle.y < -8) particle.y = height + 8;
        if (particle.y > height + 8) particle.y = -8;

        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = "rgba(154, 120, 255, 0.72)";
        context.fill();

        for (let nextIndex = index + 1; nextIndex < particles.length; nextIndex += 1) {
          const next = particles[nextIndex];
          const distanceX = particle.x - next.x;
          const distanceY = particle.y - next.y;
          const distanceSquared = distanceX * distanceX + distanceY * distanceY;

          if (distanceSquared < CONNECTION_DISTANCE * CONNECTION_DISTANCE) {
            const opacity = 0.13 * (1 - Math.sqrt(distanceSquared) / CONNECTION_DISTANCE);
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(next.x, next.y);
            context.strokeStyle = `rgba(122, 72, 255, ${opacity})`;
            context.lineWidth = 0.75;
            context.stroke();
          }
        }
      }
    };

    const animate = () => {
      pointer.x += (pointer.targetX - pointer.x) * 0.055;
      pointer.y += (pointer.targetY - pointer.y) * 0.055;
      scroll += (targetScroll - scroll) * 0.06;

      const scrollOffset = Math.min(scroll * 0.018, 54);
      imageLayer.style.transform = reducedMotion.matches
        ? "translate3d(0, 0, 0) scale(1.06)"
        : `translate3d(${pointer.x * -24}px, ${pointer.y * -18 - scrollOffset}px, 0) scale(1.1)`;

      if (!reducedMotion.matches) drawParticles();
      frameId = window.requestAnimationFrame(animate);
    };

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && frameId === 0) frameId = window.requestAnimationFrame(animate);
      if (!isVisible && frameId !== 0) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    };

    const onMotionPreferenceChange = () => {
      createParticles();
      if (reducedMotion.matches) context.clearRect(0, 0, width, height);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.addEventListener("change", onMotionPreferenceChange);
    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", onMotionPreferenceChange);
    };
  }, []);

  return (
    <div className={styles.root} aria-hidden="true" data-testid="interactive-background">
      <div className={styles.imageLayer} ref={imageLayerRef} data-testid="background-image-layer">
        <Image
          src="/images/synergymaze-interactive-background.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.image}
        />
      </div>
      <canvas className={styles.canvas} ref={canvasRef} />
      <div className={styles.scrim} />
    </div>
  );
}
