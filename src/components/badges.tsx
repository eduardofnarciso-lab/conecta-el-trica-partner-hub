import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Tier } from "@/lib/mocks";

const tierStyles: Record<Tier, string> = {
  Bronze: "bg-bronze/15 text-bronze border-bronze/30",
  Prata: "bg-silver/25 text-foreground border-silver/40",
  Ouro: "bg-gold/20 text-foreground border-gold/40",
  Diamante: "bg-diamond/20 text-foreground border-diamond/40",
};

export function TierBadge({ tier, className }: { tier: Tier | string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium border", tierStyles[tier as Tier], className)}>
      {tier}
    </Badge>
  );
}

const statusStyles: Record<string, string> = {
  Ativa: "bg-success/15 text-success border-success/30",
  Encerrada: "bg-muted text-muted-foreground border-border",
  "Em breve": "bg-energy/20 text-foreground border-energy/40",
  Aprovada: "bg-success/15 text-success border-success/30",
  Convertida: "bg-primary/10 text-primary border-primary/30",
  Reprovada: "bg-destructive/15 text-destructive border-destructive/30",
  "Em análise": "bg-energy/15 text-foreground border-energy/30",
  Ativo: "bg-success/15 text-success border-success/30",
  Bloqueado: "bg-destructive/15 text-destructive border-destructive/30",
  Confirmado: "bg-success/15 text-success border-success/30",
  Confirmada: "bg-success/15 text-success border-success/30",
  Concluído: "bg-success/15 text-success border-success/30",
  "Em separação": "bg-energy/15 text-foreground border-energy/30",
  "Em aberto": "bg-energy/15 text-foreground border-energy/30",
  Paga: "bg-success/15 text-success border-success/30",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium border", statusStyles[status] ?? "bg-muted text-muted-foreground", className)}>
      {status}
    </Badge>
  );
}
