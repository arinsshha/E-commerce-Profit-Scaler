import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition",
        variant === "default" ? "bg-black text-white hover:bg-gray-800" : "border bg-white text-gray-900 hover:bg-gray-50",
        className
      )}
      {...props}
    />
  );
}
