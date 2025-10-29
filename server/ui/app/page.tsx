'use client'

import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Leva } from "leva";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <Leva hidden />
    </>
  );
}
