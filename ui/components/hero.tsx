"use client";

import { useState } from "react";
import { GL } from "./gl";
import { Pill } from "./pill";

export function Hero() {
  const [hovering] = useState(false);
  return (
    <div className="flex flex-col h-svh justify-between">
      <GL hovering={hovering} />

      <div className="pb-16 mt-auto text-center relative">
        <Pill className="mb-6">BETA RELEASE</Pill>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-sentient">
          Build faster with <br />
          <i className="font-light">limitless APIs</i>
        </h1>
        <p className="font-mono text-sm sm:text-base text-foreground/60 text-balance mt-8 max-w-[480px] mx-auto">
          Discover, connect, and scale with the world’s most advanced API marketplace
        </p>
        <div className="mt-14 h-[40px] sm:h-[44px]" />
      </div>
    </div>
  );
}
