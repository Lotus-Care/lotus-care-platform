import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "outlined" | "elevated";
}

export default function Card({
  children,
  variant = "default",
  className = "",
  ...props
}: CardProps) {
  const baseClasses = "rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm";
  
  const variantClasses = {
    default: "",
    outlined: "border-2",
    elevated: "shadow-lg hover:shadow-xl transition-shadow",
  };
  
  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

