import { type ReactNode } from "react";

type PixelSize = "sm" | "md" | "lg" | "xl";

type PixelTextProps = {
 children: ReactNode;
 as?: "span" | "p" | "div";
 className?: string;
 size?: PixelSize;
};

const sizeClasses: Record<PixelSize, string> = {
 sm: "text-[0.75rem] leading-relaxed sm:text-sm",
 md: "text-sm leading-relaxed sm:text-sm md:text-base",
 lg: "text-sm leading-relaxed sm:text-base md:text-lg lg:text-xl",
 xl: "text-base leading-relaxed sm:text-lg md:text-xl lg:text-2xl",
};

export function PixelText({
 children,
 as: Tag = "span",
 className = "",
 size = "md",
}: PixelTextProps) {
 return (
 <Tag
 className={`font-pixel uppercase tracking-wider text-purple-light ${sizeClasses[size]} ${className}`}
 >
 {children}
 </Tag>
 );
}
