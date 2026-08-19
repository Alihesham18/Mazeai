"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

export function TrainingProgramImage({
  alt,
  children,
  className,
  priority = false,
  sizes,
  src
}: {
  alt: string;
  children: ReactNode;
  className?: string;
  priority?: boolean;
  sizes: string;
  src: string | null;
}) {
  const [isAvailable, setIsAvailable] = useState(true);

  return (
    <>
      {children}
      {isAvailable && src ? (
        <Image
          className={className}
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          onError={() => setIsAvailable(false)}
        />
      ) : null}
    </>
  );
}
