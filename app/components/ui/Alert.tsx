import { ReactNode } from "react";

interface AlertProps {
  variant?: "error" | "warning" | "info" | "success";
  children: ReactNode;
  className?: string;
}

export default function Alert({
  variant = "error",
  children,
  className = "",
}: AlertProps) {
  const variantClasses = {
    error: "border-red-500/50 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    warning: "border-yellow-500/50 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
    info: "border-blue-500/50 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    success: "border-green-500/50 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  };
  
  return (
    <div className={`rounded-xl border px-4 py-3 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}

