import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "outline" | "ghost" | "inverse" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Si renseigné, le bouton devient un lien interne. */
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  /** Ouvre le lien dans un nouvel onglet (rel sécurisé). */
  external?: boolean;
  className?: string;
  children: ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
  "aria-label"?: string;
  title?: string;
}


const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-none border text-center font-sans text-[0.9375rem] font-medium tracking-[0.01em] transition-[background-color,border-color,color,transform] duration-[250ms] ease-ccjv";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-ccjv-green bg-ccjv-green text-white hover:border-ccjv-green-strong hover:bg-ccjv-green-strong",
  outline:
    "border-ccjv-ink bg-transparent text-ccjv-ink hover:border-ccjv-green hover:text-ccjv-green",
  ghost:
    "border-transparent bg-transparent px-2 text-ccjv-green underline-offset-4 hover:text-ccjv-green-strong hover:underline",
  inverse:
    "border-white bg-transparent text-white hover:border-ccjv-cream hover:bg-white/5 hover:text-ccjv-cream",
  danger:
    "border-[#b91c1c] bg-[#b91c1c] text-white hover:border-[#991b1b] hover:bg-[#991b1b]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-[36px] px-3.5 text-xs font-medium",
  md: "min-h-[44px] px-6",
  lg: "min-h-[52px] px-8 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  href,
  type = "button",
  disabled = false,
  loading = false,
  external = false,
  className,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  const classes = cn(
    base,
    variants[variant],
    sizes[size],
    "active:translate-y-[1px]",
    disabled && "pointer-events-none cursor-not-allowed opacity-40",
    className,
  );

  const inner = (
    <>
      {loading && (
        <span
          className="h-[1em] w-[1em] shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden="true"
        />
      )}
      <span className="inline-flex items-center gap-2">{children}</span>
    </>
  );

  if (href) {
    const linkProps = external
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {};
    return (
      <Link
        href={href}
        className={classes}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        {...linkProps}
        {...rest}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      aria-busy={loading || undefined}
      onClick={onClick}
      {...rest}
    >
      {inner}
    </button>
  );
}
