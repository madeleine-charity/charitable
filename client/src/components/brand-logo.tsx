import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt=""
      className={cn("h-9 w-9 shrink-0 rounded-md bg-white", className)}
    />
  );
}
