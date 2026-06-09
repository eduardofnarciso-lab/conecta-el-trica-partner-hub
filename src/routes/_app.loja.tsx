import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Gift, Zap, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mockRewards, rewardCategories, currentUser } from "@/lib/mocks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/loja")({
  component: LojaPage,
});

function LojaPage() {
  const [cat, setCat] = useState<string>("Todos");
  const [q, setQ] = useState("");
  const filtered = mockRewards.filter((r) => {
    if (cat !== "Todos" && r.category !== cat) return false;
    if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Loja de prêmios</h1>
          <p className="text-muted-foreground text-sm mt-1">Troque seus pontos por recompensas exclusivas.</p>
        </div>
        <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 flex items-center gap-2">
          <Zap className="h-4 w-4 text-energy" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-primary-foreground/70">Seu saldo</div>
            <div className="font-bold">{currentUser.points.toLocaleString("pt-BR")} pts</div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar prêmio..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {rewardCategories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-full border transition-colors",
                cat === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/40",
              )}
            >{c}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Gift className="h-12 w-12 mx-auto mb-2 opacity-40" />
          Nenhum prêmio encontrado.
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((r) => {
            const canRedeem = r.available && currentUser.points >= r.cost;
            return (
              <Card key={r.id} className="overflow-hidden flex flex-col">
                <div className="h-32 bg-gradient-to-br from-accent to-muted flex items-center justify-center text-5xl">
                  {r.emoji}
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <Badge variant="outline" className="self-start text-[10px]">{r.category}</Badge>
                  <h3 className="font-semibold mt-2">{r.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">{r.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm font-bold">
                      <Zap className="h-4 w-4 text-energy" /> {r.cost.toLocaleString("pt-BR")}
                    </div>
                    {!r.available && <span className="text-[10px] text-muted-foreground">Indisponível</span>}
                  </div>
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    disabled={!canRedeem}
                    onClick={() => toast.success(`Resgate de "${r.name}" solicitado!`)}
                  >
                    {canRedeem ? "Resgatar" : !r.available ? "Indisponível" : "Pontos insuficientes"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
