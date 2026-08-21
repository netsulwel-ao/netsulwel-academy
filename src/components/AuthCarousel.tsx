"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { TransitionLink } from "./TransitionLink";

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

const EASE = [0.16, 1, 0.3, 1] as const;

export function AuthCarousel() {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const start = () => setInterval(() => setIndex((p) => (p + 1) % slides.length), 5500);
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
      {/* Images — crossfade + ken burns */}
      {slides.map((s, i) => (
        <motion.div
          key={s.id}
          className={`absolute inset-0 ${i === index ? "opacity-100" : "opacity-0"}`}
          animate={{ opacity: i === index ? 1 : 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        >
          {failed.has(i) ? (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-950" />
          ) : (
            <motion.img
              src={s.image}
              alt={s.title}
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setFailed((p) => new Set(p).add(i))}
              initial={{ scale: 1.12 }}
              animate={
                i === index && !reduceMotion
                  ? { scale: 1 }
                  : { scale: 1.12 }
              }
              transition={{ duration: 6, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </motion.div>
      ))}

      {/* Overlays */}
      <div className="absolute inset-0 bg-gray-950 z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950/20 to-transparent z-10" />

      {/* Logo */}
      <TransitionLink
        href="/"
        className="absolute left-10 top-10 z-20 flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <img src="/Logo-Academy-White.svg" alt="Academy" className="h-11 w-auto brightness-0 invert" />
        <span className="text-xl font-bold text-white tracking-tight">Netsulwel</span>
      </TransitionLink>

      {/* Bottom content */}
      <div className="absolute bottom-12 left-10 right-10 z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {/* Tag */}
            <motion.span
              className="inline-block font-mono text-[13px] uppercase tracking-[0.2em] text-white border border-white px-2.5 py-1 mb-4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              {slide.tag}
            </motion.span>

            {/* Title */}
            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
              {slide.title}
            </h2>
            <p className="mt-3 text-sm text-gray-300 max-w-sm leading-relaxed">
              {slide.desc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Indicators */}
        <div className="mt-8 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`relative h-0.5 overflow-hidden ${
                i === index ? "w-8" : "w-3 bg-white"
              }`}
              aria-label={`Slide ${i + 1}`}
            >
              {i === index && (
                <motion.span
                  className="absolute inset-0 bg-white"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 5.5, ease: "linear" }}
                  style={{ transformOrigin: "left" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
