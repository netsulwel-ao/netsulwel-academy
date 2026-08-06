"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const slides = [
  {
    id: 1,
    image: "https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg?auto=compress&cs=tinysrgb&w=1600",
    tag: "programação",
    title: "Cursos de programação",
    desc: "Do zero ao avançado com projectos práticos e mentoria ao vivo.",
  },
  {
    id: 2,
    image: "https://images.pexels.com/photos/4143800/pexels-photo-4143800.jpeg?auto=compress&cs=tinysrgb&w=1600",
    tag: "ao vivo",
    title: "Aulas ao vivo",
    desc: "Em tempo real com instrutores experientes. Tire dúvidas na hora.",
  },
  {
    id: 3,
    image: "https://images.pexels.com/photos/6953925/pexels-photo-6953925.jpeg?auto=compress&cs=tinysrgb&w=1600",
    tag: "comunidade",
    title: "Comunidade de alunos",
    desc: "Troque conhecimento e cresça junto com mais de 50 mil pessoas.",
  },
];

export function AuthCarousel() {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(new Set());

  useEffect(() => {
    const start = () => setInterval(() => setIndex((p) => (p + 1) % slides.length), 5000);
    let timer = start();
    const onVisibility = () => {
      clearInterval(timer);
      if (!document.hidden) timer = start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const slide = slides[index];

  return (
    <div className="relative hidden lg:flex w-[52%] shrink-0 flex-col overflow-hidden bg-gray-950">
      {/* Images */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0"}`}
        >
          {failed.has(i) ? (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-950" />
          ) : (
            <img
              src={s.image}
              alt={s.title}
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setFailed((p) => new Set(p).add(i))}
            />
          )}
        </div>
      ))}

      {/* Overlays */}
      <div className="absolute inset-0 bg-gray-950/30 z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950/20 to-transparent z-10" />

      {/* Logo */}
      <Link
        href="/"
        className="absolute left-10 top-10 z-20 flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <img src="/Logo-Academy-White.svg" alt="Academy" className="h-11 w-auto brightness-0 invert" />
        <span className="text-xl font-bold text-white tracking-tight">Netsulwel</span>
      </Link>

      {/* Bottom content */}
      <div className="absolute bottom-12 left-10 right-10 z-20">
        {/* Tag */}
        <span className="inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 border border-white/15 px-2.5 py-1 mb-4">
          {slide.tag}
        </span>

        {/* Title */}
        <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
          {slide.title}
        </h2>
        <p className="mt-3 text-sm text-gray-300 max-w-sm leading-relaxed">
          {slide.desc}
        </p>

        {/* Indicators */}
        <div className="mt-8 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-0.5 transition-all duration-300 ${
                i === index ? "w-8 bg-white" : "w-3 bg-white/30"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
