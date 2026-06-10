import { cn } from "@/lib/utils";

/**
 * Símbolo Elettro Ponto — disco amarelo com as ondas brancas.
 * Recriação aproximada em SVG. Se você tiver o arquivo oficial (PNG/SVG),
 * coloque em `public/logo.png` e troque por <img src="/logo.png" />.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Elettro Ponto">
      <circle cx="50" cy="50" r="48" fill="var(--energy)" />
      <g fill="none" stroke="#ffffff" strokeLinecap="round">
        <path d="M22 60 Q44 44 80 34" strokeWidth="7" />
        <path d="M22 70 Q46 54 82 46" strokeWidth="7" />
        <path d="M24 80 Q48 66 78 60" strokeWidth="7" />
      </g>
    </svg>
  );
}

/** Logo completo: símbolo + wordmark "Elettro ponto". */
export function Logo({
  className,
  markClassName,
  textClassName,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark className={cn("h-9 w-9 shrink-0", markClassName)} />
      <div className={cn("leading-none", textClassName)}>
        <div className="text-base font-extrabold italic tracking-tight">
          Elettro<span className="align-super text-[0.5em] font-semibold">®</span>
        </div>
        <div className="text-xs italic font-medium opacity-90 -mt-0.5 ml-0.5">ponto</div>
      </div>
    </div>
  );
}
