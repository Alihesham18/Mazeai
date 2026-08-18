"use client";

import Image from "next/image";
import { useState } from "react";

export function CaseStudyCoverImage({
  alt,
  className,
  imageClassName,
  priority = false,
  sizes,
  src
}: {
  alt: string;
  className: string;
  imageClassName: string;
  priority?: boolean;
  sizes: string;
  src: string;
}) {
  const [available, setAvailable] = useState(true);
  if (!available) return null;

  return (
    <div className={className}>
      <Image
        alt={alt}
        className={imageClassName}
        fill
        onError={() => setAvailable(false)}
        priority={priority}
        sizes={sizes}
        src={src}
      />
    </div>
  );
}
