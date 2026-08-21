"use client";

import { useState, useEffect } from "react";

const carouselSlides = [
  {
    id: 1,
    image: "https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg?auto=compress&cs=tinysrgb&w=1600",
    title: "Cursos de programação",
    desc: "Aprenda a programar do zero ao avançado com projectos práticos e mentoria ao vivo.",
  },
  {
    id: 2,
    image: "https://images.pexels.com/photos/4143800/pexels-photo-4143800.jpeg?auto=compress&cs=tinysrgb&w=1600",
    title: "Aulas ao vivo",
    desc: "Participe de aulas em tempo real com instrutores experientes e tire dúvidas na hora.",
  },
  {
    id: 3,
    image: "https://images.pexels.com/photos/6953925/pexels-photo-6953925.jpeg?auto=compress&cs=tinysrgb&w=1600",
    title: "Comunidade de alunos",
    desc: "Conecte-se com outros estudantes, troque conhecimento e cresça junto com a comunidade.",
  }
];

export default function LoginCarousel() {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
      {carouselSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === slideIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-purple/90 via-purple-dark/80 to-black/70" />
          <div className="absolute inset-0 flex flex-col justify-center px-16">
            <h2 className="text-4xl font-bold text-white mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {slide.title}
            </h2>
            <p className="text-lg text-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              {slide.desc}
            </p>
          </div>
        </div>
      ))}
      <div className="absolute bottom-8 left-16 flex gap-2">
        {carouselSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setSlideIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === slideIndex ? "w-8 bg-white" : "w-2 bg-white"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
