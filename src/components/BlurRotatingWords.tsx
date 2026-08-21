"use client";

import { useEffect, useState } from "react";
import { Code2, Wallet, Cpu, TrendingUp, type LucideIcon } from "lucide-react";

const WORDS: { text: string; icon: LucideIcon }[] = [
 { text: "programação", icon: Code2 },
 { text: "finanças", icon: Wallet },
 { text: "tecnologia", icon: Cpu },
 { text: "investimentos", icon: TrendingUp },
];

const ICON_IN_MS = 380;
const WORD_IN_MS = 720;
const EXIT_MS = 720;
const HOLD_MS = 1400;
const GAP_MS = 50;

type Phase = "icon-in" | "word-in" | "stable" | "exiting" | "gap";

function WordBlock({
 text,
 Icon,
 phase,
}: {
 text: string;
 Icon: LucideIcon;
 phase: Exclude<Phase, "gap">;
}) {
 const wordOpen = phase !== "icon-in";
 const exiting = phase === "exiting";

 return (
 <span
 className={`flex max-w-full items-center justify-center gap-3 sm:gap-4 ${
 exiting ? "animate-pair-blur-out" : ""
 }`}
 >
 <Icon
 className={`h-10 w-10 shrink-0 text-white sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 ${
 phase === "icon-in" ? "animate-icon-blur-in" : ""
 }`}
 style={
 phase === "word-in" || phase === "stable"
 ? { filter: "blur(0)", opacity: 1 }
 : undefined
 }
 strokeWidth={1.5}
 aria-hidden
 />

 <span
 className={`word-slot-grid min-w-0 ${wordOpen ? "word-slot-grid-open" : "word-slot-grid-closed"}`}
 >
 <span className="overflow-hidden">
 <span
 className={`inline-block whitespace-nowrap pl-1 text-[clamp(1.35rem,4.2vw,2.65rem)] font-extrabold uppercase leading-none tracking-wide text-white sm:pl-2 md:text-4xl lg:text-5xl ${
 phase === "word-in" ? "animate-word-blur-in-soft" : ""
 }`}
 style={
 phase === "stable"
 ? { filter: "blur(0)", opacity: 1, transform: "none" }
 : undefined
 }
 >
 {text}
 </span>
 </span>
 </span>
 </span>
 );
}

export function BlurRotatingWords() {
 const [index, setIndex] = useState(0);
 const [phase, setPhase] = useState<Phase>("icon-in");

 useEffect(() => {
 let timer: ReturnType<typeof setTimeout>;

 switch (phase) {
 case "icon-in":
 timer = setTimeout(() => setPhase("word-in"), ICON_IN_MS);
 break;
 case "word-in":
 timer = setTimeout(() => setPhase("stable"), WORD_IN_MS);
 break;
 case "stable":
 timer = setTimeout(() => setPhase("exiting"), HOLD_MS);
 break;
 case "exiting":
 timer = setTimeout(() => setPhase("gap"), EXIT_MS);
 break;
 case "gap":
 timer = setTimeout(() => {
 setIndex((i) => (i + 1) % WORDS.length);
 setPhase("icon-in");
 }, GAP_MS);
 break;
 }

 return () => clearTimeout(timer);
 }, [phase, index]);

 const word = WORDS[index];

 return (
 <span
 className="relative block w-full h-full"
 aria-live="polite"
 >
 <span className="flex h-full w-full items-center justify-center">
 {phase !== "gap" && (
 <WordBlock
 key={index}
 text={word.text}
 Icon={word.icon}
 phase={phase}
 />
 )}
 </span>
 </span>
 );
}
