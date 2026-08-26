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
    nodes: [
      { x: 548, y: 205, tone: "violet", delay: -1.1, duration: 4.8, drift: 2 },
      { x: 610, y: 137, tone: "violet", delay: -2.7, duration: 5.4, drift: 1 },
      { x: 676, y: 87, tone: "gold", delay: -0.8, duration: 4.2, drift: 2, featured: true },
      { x: 742, y: 121, tone: "gold", delay: -3.2, duration: 5.7, drift: 1 },
      { x: 808, y: 82, tone: "gold", delay: -1.9, duration: 4.9, drift: 2 },
      { x: 862, y: 151, tone: "gold", delay: -4.1, duration: 6.1, drift: 1, featured: true },
      { x: 905, y: 218, tone: "gold", delay: -0.4, duration: 4.6, drift: 2 },
      { x: 828, y: 247, tone: "gold", delay: -2.3, duration: 5.2, drift: 1 },
      { x: 762, y: 206, tone: "violet", delay: -3.8, duration: 6.3, drift: 2 },
      { x: 690, y: 248, tone: "violet", delay: -1.5, duration: 5.8, drift: 1 },
      { x: 728, y: 308, tone: "gold", delay: -2.9, duration: 4.7, drift: 2, featured: true },
      { x: 603, y: 277, tone: "violet", delay: -0.7, duration: 5.5, drift: 1 },
      { x: 936, y: 110, tone: "gold", delay: -3.5, duration: 6.2, drift: 2 },
      { x: 480, y: 254, tone: "violet", delay: -2.1, duration: 5.1, drift: 1 }
    ],
    paths: [
      "M480 254L548 205L610 137L676 87L742 121L808 82L862 151L905 218",
      "M548 205L603 277L690 248L762 206L828 247L905 218",
      "M610 137L690 248L728 308L828 247",
      "M742 121L762 206L862 151L936 110"
    ],
    traveling: [1]
  },
  impact: {
    nodes: [
      { x: 118, y: 140, tone: "gold", delay: -1.6, duration: 5.1, drift: 1 },
      { x: 218, y: 155, tone: "gold", delay: -3.4, duration: 6.2, drift: 2, featured: true },
      { x: 273, y: 276, tone: "gold", delay: -0.8, duration: 4.9, drift: 1 },
      { x: 429, y: 116, tone: "gold", delay: -2.5, duration: 5.6, drift: 2, featured: true },
      { x: 477, y: 184, tone: "violet", delay: -4.2, duration: 6.4, drift: 1 },
      { x: 493, y: 286, tone: "violet", delay: -1.1, duration: 5.3, drift: 2 },
      { x: 585, y: 177, tone: "gold", delay: -2.9, duration: 4.8, drift: 1 },
      { x: 656, y: 205, tone: "gold", delay: -0.5, duration: 5.9, drift: 2, featured: true },
      { x: 765, y: 135, tone: "violet", delay: -3.7, duration: 6.1, drift: 1 },
      { x: 845, y: 157, tone: "gold", delay: -1.8, duration: 5.2, drift: 2 },
      { x: 874, y: 293, tone: "gold", delay: -4.5, duration: 6.5, drift: 1, featured: true },
      { x: 952, y: 238, tone: "gold", delay: -2.2, duration: 5.7, drift: 2 }
    ],
    paths: [
      "M118 140Q175 108 218 155T429 116T585 177T765 135T845 157",
      "M218 155Q285 230 273 276Q380 218 477 184T656 205T874 293",
      "M429 116Q472 190 493 286Q560 230 656 205Q760 250 874 293L952 238",
      "M118 140Q350 56 585 177Q735 66 845 157"
    ],
    traveling: [0, 2]
  }
} as const satisfies Record<
  "hero" | "impact",
  {
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
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let isInside = false;
    let isVisible = true;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    const networkNodes = Array.from(
      section.querySelectorAll<SVGCircleElement>("[data-network-node]")
    );

    const renderFrame = () => {
      currentX += (targetX - currentX) * 0.09;
      currentY += (targetY - currentY) * 0.09;
      section.style.setProperty("--pointer-x", `${50 + currentX * 50}%`);
      section.style.setProperty("--pointer-y", `${50 + currentY * 50}%`);
      section.style.setProperty("--parallax-x", `${currentX * 9}px`);
      section.style.setProperty("--parallax-y", `${currentY * 7}px`);
      section.style.setProperty("--background-x", `${currentX * -4}px`);
      section.style.setProperty("--background-y", `${currentY * -3}px`);
      const pointerX = (currentX + 1) / 2;
      const pointerY = (currentY + 1) / 2;
      for (const node of networkNodes) {
        const nodeX = Number(node.dataset.nodeX) / 1000;
        const nodeY = Number(node.dataset.nodeY) / 400;
        const distance = Math.hypot((nodeX - pointerX) * 1.05, (nodeY - pointerY) * 0.82);
        const proximity = isInside ? Math.max(0, 1 - distance / 0.22) : 0;
        node.style.setProperty("--node-proximity", proximity.toFixed(3));
      }
      const settled = Math.abs(targetX - currentX) < 0.002 && Math.abs(targetY - currentY) < 0.002;
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
      requestFrame();
    };
    const onPointerLeave = () => {
      isInside = false;
      targetX = 0;
      targetY = 0;
      delete section.dataset.pointerActive;
      requestFrame();
    };
    const resetMotion = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
      isInside = false;
      currentX = currentY = targetX = targetY = 0;
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
  }, []);

  return (
    <section
      ref={sectionRef}
      className={[styles.interactiveSection, className].filter(Boolean).join(" ")}
      data-illumination={variant}
      {...sectionProps}
    >
      {children}
      <NetworkOverlay variant={variant} />
      <span className={styles.goldIllumination} aria-hidden="true" />
      <span className={styles.violetIllumination} aria-hidden="true" />
    </section>
  );
}

function NetworkOverlay({ variant }: { variant: "hero" | "impact" }) {
  const data = networkData[variant];

  return (
    <svg
      className={styles.networkOverlay}
      data-network={variant}
      viewBox="0 0 1000 400"
      preserveAspectRatio="none"
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
