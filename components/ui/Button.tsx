"use client";

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { SE, unlockAudio } from "@/lib/sound";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-primary)] text-black font-bold hover:bg-cyan-300 active:scale-95",
  secondary:
    "bg-[var(--color-secondary)] text-black font-bold hover:bg-fuchsia-200 active:scale-95",
  ghost:
    "border border-[var(--color-border)] text-zinc-300 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] active:scale-95",
  danger:
    "bg-[var(--color-warning)] text-black font-bold hover:opacity-80 active:scale-95",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg tracking-wider",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  onClick,
  children,
  ...rest
}: Props) {
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    await unlockAudio();
    SE.tap();
    onClick?.(e);
  };

  return (
    <button
      {...rest}
      onClick={handleClick}
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center rounded-lg transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] select-none",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          rest.disabled && "opacity-40 cursor-not-allowed",
          className
        )
      )}
    >
      {children}
    </button>
  );
}
