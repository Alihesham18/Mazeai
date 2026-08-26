"use client";

import { BrainCircuit, ChevronDown, Eye, FlaskConical, Network } from "lucide-react";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./ResearchAreasPage.module.css";

export interface ResearchAreaItem {
  number: string;
  code: string;
  icon: "brain" | "eye" | "network" | "flask";
  title: string;
  description: string;
  focusLabel: string;
  tags: string[];
}

const icons = { brain: BrainCircuit, eye: Eye, network: Network, flask: FlaskConical } as const;

interface NetworkNodeDefinition {
  x: number;
  y: number;
  tone: "gold" | "violet";
  delay: number;
  duration: number;
  drift: number;
  featured?: boolean;
}

const networkData = {
  hero: {
    width: 1536,
    height: 511,
    nodes: [
      { x: 716, y: 234, tone: "violet", delay: -2.1, duration: 5.1, drift: 1 },
      { x: 846, y: 179, tone: "violet", delay: -1.1, duration: 4.8, drift: 2 },
      { x: 904, y: 124, tone: "violet", delay: -2.7, duration: 5.4, drift: 1 },
      { x: 945, y: 225, tone: "violet", delay: -3.8, duration: 6.3, drift: 2 },
      { x: 1003, y: 196, tone: "gold", delay: -0.8, duration: 4.2, drift: 2, featured: true },
      { x: 1025, y: 78, tone: "gold", delay: -1.9, duration: 4.9, drift: 2, featured: true },
      { x: 1068, y: 335, tone: "gold", delay: -2.9, duration: 4.7, drift: 2, featured: true },
      { x: 1113, y: 194, tone: "gold", delay: -4.1, duration: 6.1, drift: 1 },
      { x: 1167, y: 143, tone: "gold", delay: -3.2, duration: 5.7, drift: 1 },
      { x: 1216, y: 218, tone: "gold", delay: -0.4, duration: 4.6, drift: 2 },
      { x: 1296, y: 176, tone: "gold", delay: -3.5, duration: 6.2, drift: 2 },
      { x: 942, y: 287, tone: "violet", delay: -0.7, duration: 5.5, drift: 1 },
      { x: 1138, y: 276, tone: "gold", delay: -2.3, duration: 5.2, drift: 1 },
      { x: 1370, y: 126, tone: "gold", delay: -1.5, duration: 5.8, drift: 1 }
    ],
    paths: [
      "M716 234L846 179L904 124L1025 78L1167 143L1296 176L1370 126",
      "M846 179L945 225L1003 196L1113 194L1216 218L1296 176",
      "M945 225L942 287L1068 335L1138 276L1216 218",
      "M1003 196L1025 78L1113 194L1167 143"
    ],
    traveling: [1]
  },
  impact: {
    width: 1536,
    height: 510,
    nodes: [
      { x: 200, y: 197, tone: "gold", delay: -1.6, duration: 5.1, drift: 1 },
      { x: 360, y: 178, tone: "gold", delay: -3.4, duration: 6.2, drift: 2, featured: true },
      { x: 368, y: 335, tone: "gold", delay: -0.8, duration: 4.9, drift: 1 },
      { x: 484, y: 344, tone: "gold", delay: -2.5, duration: 5.6, drift: 2 },
      { x: 680, y: 129, tone: "gold", delay: -4.2, duration: 6.4, drift: 1, featured: true },
      { x: 740, y: 390, tone: "violet", delay: -1.1, duration: 5.3, drift: 2 },
      { x: 877, y: 210, tone: "gold", delay: -2.9, duration: 4.8, drift: 1 },
      { x: 958, y: 240, tone: "gold", delay: -0.5, duration: 5.9, drift: 2, featured: true },
      { x: 1030, y: 127, tone: "violet", delay: -3.7, duration: 6.1, drift: 1 },
      { x: 1150, y: 190, tone: "gold", delay: -1.8, duration: 5.2, drift: 2 },
      { x: 1268, y: 460, tone: "gold", delay: -4.5, duration: 6.5, drift: 1, featured: true },
      { x: 1450, y: 363, tone: "gold", delay: -2.2, duration: 5.7, drift: 2 }
    ],
    paths: [
      "M200 197Q280 125 360 178T680 129T877 210T1030 127T1150 190",
      "M360 178Q430 260 368 335Q420 360 484 344Q610 255 680 129",
      "M680 129Q735 220 740 390Q835 285 877 210T958 240T1268 460L1450 363",
      "M360 178Q610 50 877 210Q1010 76 1150 190"
    ],
    traveling: [0, 2]
  }
} as const satisfies Record<
  "hero" | "impact",
  {
    width: number;
    height: number;
    nodes: readonly NetworkNodeDefinition[];
    paths: readonly string[];
    traveling: readonly number[];
  }
>;

type InteractiveIlluminationProps = Omit<ComponentPropsWithoutRef<"section">, "children"> & {
  children: ReactNode;
  variant: "hero" | "impact";
};

export function InteractiveIllumination({
  children,
  variant,
  className,
  ...sectionProps
}: InteractiveIlluminationProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof window.matchMedia !== "function") return;
    const media = section.querySelector<HTMLElement>("[data-interactive-media]");
    if (!media) return;
    const source = networkData[variant];
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let isInside = false;
    let isVisible = true;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let currentMediaX = 0.5;
    let currentMediaY = 0.5;
    let targetMediaX = 0.5;
    let targetMediaY = 0.5;
    const networkNodes = Array.from(
      section.querySelectorAll<SVGCircleElement>("[data-network-node]")
    );

    const renderFrame = () => {
      currentX += (targetX - currentX) * 0.09;
      currentY += (targetY - currentY) * 0.09;
      currentMediaX += (targetMediaX - currentMediaX) * 0.11;
      currentMediaY += (targetMediaY - currentMediaY) * 0.11;
      section.style.setProperty("--pointer-x", `${50 + currentX * 50}%`);
      section.style.setProperty("--pointer-y", `${50 + currentY * 50}%`);
      section.style.setProperty("--parallax-x", `${currentX * 9}px`);
      section.style.setProperty("--parallax-y", `${currentY * 7}px`);
      section.style.setProperty("--background-x", `${currentX * -4}px`);
      section.style.setProperty("--background-y", `${currentY * -3}px`);
      for (const node of networkNodes) {
        const nodeX = Number(node.dataset.nodeX) / source.width;
        const nodeY = Number(node.dataset.nodeY) / source.height;
        const distance = Math.hypot((nodeX - currentMediaX) * 1.05, (nodeY - currentMediaY) * 0.82);
        const proximity = isInside ? Math.max(0, 1 - distance / 0.22) : 0;
        node.style.setProperty("--node-proximity", proximity.toFixed(3));
      }
      const settled =
        Math.abs(targetX - currentX) < 0.002 &&
        Math.abs(targetY - currentY) < 0.002 &&
        Math.abs(targetMediaX - currentMediaX) < 0.002 &&
        Math.abs(targetMediaY - currentMediaY) < 0.002;
      if (isVisible && (isInside || !settled)) frameId = window.requestAnimationFrame(renderFrame);
      else frameId = 0;
    };
    const requestFrame = () => {
      if (!frameId && isVisible && finePointer.matches && !reducedMotion.matches)
        frameId = window.requestAnimationFrame(renderFrame);
    };
    const onPointerEnter = (event: PointerEvent) => {
      if (!finePointer.matches || reducedMotion.matches || event.pointerType === "touch") return;
      isInside = true;
      section.dataset.pointerActive = "true";
      requestFrame();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!isInside || !finePointer.matches || reducedMotion.matches) return;
      const bounds = section.getBoundingClientRect();
      targetX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
      targetY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
      const mediaBounds = media.getBoundingClientRect();
      const coverScale = Math.max(
        mediaBounds.width / source.width,
        mediaBounds.height / source.height
      );
      const renderedWidth = source.width * coverScale;
      const renderedHeight = source.height * coverScale;
      const cropOffsetX = (mediaBounds.width - renderedWidth) / 2;
      const cropOffsetY = (mediaBounds.height - renderedHeight) / 2;
      targetMediaX = (event.clientX - mediaBounds.left - cropOffsetX) / coverScale / source.width;
      targetMediaY = (event.clientY - mediaBounds.top - cropOffsetY) / coverScale / source.height;
      requestFrame();
    };
    const onPointerLeave = () => {
      isInside = false;
      targetX = 0;
      targetY = 0;
      targetMediaX = 0.5;
      targetMediaY = 0.5;
      delete section.dataset.pointerActive;
      requestFrame();
    };
    const resetMotion = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
      isInside = false;
      currentX = currentY = targetX = targetY = 0;
      currentMediaX = targetMediaX = 0.5;
      currentMediaY = targetMediaY = 0.5;
      delete section.dataset.pointerActive;
      for (const property of [
        "--pointer-x",
        "--pointer-y",
        "--parallax-x",
        "--parallax-y",
        "--background-x",
        "--background-y"
      ])
        section.style.removeProperty(property);
      for (const node of networkNodes) node.style.removeProperty("--node-proximity");
    };
    const observer =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
            if (!isVisible && frameId) {
              window.cancelAnimationFrame(frameId);
              frameId = 0;
            } else if (isVisible && isInside) requestFrame();
          })
        : null;

    section.addEventListener("pointerenter", onPointerEnter, { passive: true });
    section.addEventListener("pointermove", onPointerMove, { passive: true });
    section.addEventListener("pointerleave", onPointerLeave, { passive: true });
    reducedMotion.addEventListener("change", resetMotion);
    finePointer.addEventListener("change", resetMotion);
    observer?.observe(section);
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      section.removeEventListener("pointerenter", onPointerEnter);
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerleave", onPointerLeave);
      reducedMotion.removeEventListener("change", resetMotion);
      finePointer.removeEventListener("change", resetMotion);
    };
  }, [variant]);

  return (
    <section
      ref={sectionRef}
      className={[styles.interactiveSection, className].filter(Boolean).join(" ")}
      data-illumination={variant}
      {...sectionProps}
    >
      {children}
      <span className={styles.goldIllumination} aria-hidden="true" />
      <span className={styles.violetIllumination} aria-hidden="true" />
    </section>
  );
}

export function NetworkOverlay({ variant }: { variant: "hero" | "impact" }) {
  const data = networkData[variant];

  return (
    <svg
      className={styles.networkOverlay}
      data-network={variant}
      data-source-width={data.width}
      data-source-height={data.height}
      viewBox={`0 0 ${data.width} ${data.height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g className={styles.networkPaths}>
        {data.paths.map((path) => (
          <path d={path} key={path} />
        ))}
      </g>
      <g className={styles.networkTravelers}>
        {data.traveling.map((pathIndex) => (
          <path d={data.paths[pathIndex]} key={pathIndex} />
        ))}
      </g>
      <g>
        {data.nodes.map((node) => (
          <g
            className={styles.networkNodeGroup}
            key={`${node.x}-${node.y}`}
            style={
              {
                "--node-delay": `${node.delay}s`,
                "--node-duration": `${node.duration}s`,
                "--node-drift": `${node.drift}px`
              } as CSSProperties
            }
          >
            <circle
              className={styles.networkNodeHalo}
              cx={node.x}
              cy={node.y}
              r={"featured" in node && node.featured ? 8 : 6}
            />
            <circle
              className={styles.networkNode}
              data-network-node
              data-node-x={node.x}
              data-node-y={node.y}
              data-tone={node.tone}
              data-featured={"featured" in node && node.featured ? "true" : undefined}
              cx={node.x}
              cy={node.y}
              r={"featured" in node && node.featured ? 3.4 : 2.6}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function MobileResearchAreas({
  items,
  listLabel
}: {
  items: ResearchAreaItem[];
  listLabel: string;
}) {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <div
      className={styles.mobileAreas}
      aria-label={listLabel}
      data-testid="research-area-accordion"
    >
      {items.map((item, index) => {
        const Icon = icons[item.icon];
        const expanded = index === openIndex;
        const panelId = `research-area-panel-${index}`;
        return (
          <div className={styles.mobileArea} key={item.code} data-expanded={expanded}>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setOpenIndex(expanded ? -1 : index)}
            >
              <Icon size={24} strokeWidth={1.4} aria-hidden="true" />
              <span>{item.title}</span>
              <small aria-hidden="true">{item.number}</small>
              <ChevronDown className={styles.expandIcon} size={19} aria-hidden="true" />
            </button>
            <div className={styles.mobileAreaPanel} id={panelId} hidden={!expanded}>
              <p>{item.description}</p>
              <ul aria-label={item.focusLabel}>
                {item.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
