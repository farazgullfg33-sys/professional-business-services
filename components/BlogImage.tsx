"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { BlogArt } from "@/components/motion/MotionScenes";

type Props = {
  src: string;
  title: string;
  index: number;
};

export function BlogImage({ src, title, index }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <BlogArt index={index} title={title} />;
  }

  return (
    <img
      src={src}
      alt={title}
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
