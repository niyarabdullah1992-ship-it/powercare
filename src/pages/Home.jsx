import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Philosophy from "@/components/Philosophy";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const heroImage =
  "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/33667acaa_generated_2f40982e.png";
const philosophyImage =
  "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/03f626b2d_generated_8c45e749.png";
const projectImages = [
  "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/d9e09a478_generated_02d15272.png",
  "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/8f3e206cf_generated_4818a964.png",
  "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/a3c458cdc_generated_370d68f5.png",
];

export default function Home() {
  return (
    <div className="bg-background min-h-screen overflow-x-hidden" dir="rtl">
      <Navbar />
      <main>
        <Hero image={heroImage} />
        <Projects images={projectImages} />
        <Philosophy image={philosophyImage} />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}