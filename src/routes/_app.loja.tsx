import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, Zap, Search, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/loja")({
  component: LojaPage,
});

type Premio = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  custo_pontos: number;
  disponivel: boolean;
  estoque: number | null;
  imagem_url: string | null;
  emoji: string | null;
};

function LojaPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [cat, setCat] = useState<string>("Todos");
  const [q, setQ] = useState("");
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const { data: eletricista, isLoading: loadingEletricista } = useQuery({
    queryKey: ["eletricista-logado", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eletricistas")
        .select("id, nome")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; nome: string } | null;
    },
  });

  const { data: saldo = 0 } = useQuery({
    queryKey: ["saldo-eletricista", eletricista?.id],
    enabled: !!eletricista?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_saldo_eletricista")
        .select("saldo")
        .eq("eletricista_id", eletricista!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.saldo ?? 0;
    },
  });

  const { data: premios = [], isLoading: loadingPremios } = useQuery({
    queryKey: ["premios-loja"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("premios")
        .select("id, nome, descricao, categoria, custo_pontos, disponivel, estoque, imagem_url, emoji")
        .eq("disponivel", true)
        .order("custo_pontos", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Premio[];
    },
  });

  const categorias = useMemo(() => {
    const set = new Set<string>();
    for (const p of premios) if (p.categoria) set.add(p.categoria);
    return ["Todos", ...Array.from(set)];
  }, [premios]);

  const filtered = premios.filter((r) => {
    if (cat !== "Todos" && r.categoria !== cat) return false;
    if (q && !r.nome.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  async function resgatar(p: Premio) {
    if (!eletricista || !profile) return;
    if (saldo < p.custo_pontos) {
      toast.error("Pontos insuficientes para este resgate.");
      return;
    }
    setRedeemingId(p.id);
    try {
      const { error } = await supabase.from("resgates").insert({
        eletricista_id: eletricista.id,
        premio_id: p.id,
        custo_pontos: p.custo_pontos,
        criado_por: profile.id,
      });
      if (error) {
        toast.error("Não foi possível solicitar o resgate: " + error.message);
        return;
      }
      toast.success(`Resgate de "${p.nome}" solicitado! Acompanhe pelo extrato.`);
      queryClient.invalidateQueries({ queryKey: ["saldo-eletricista", eletricista.id] });
      queryClient.invalidateQueries({ queryKey: ["extrato-transacoes", eletricista.id] });
      queryClient.invalidateQueries({ queryKey: ["transacoes-dashboard", eletricista.id] });
    } finally {
      setRedeemingId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Loja de prêmios</h1>
          <p className="text-muted-foreground text-sm mt-1">Troque seus pontos por recompensas exclusivas.</p>
        </div>
        {eletricista && (
          <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-energy" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-primary-foreground/70">Seu saldo</div>
              <div className="font-bold">{saldo.toLocaleString("pt-BR")} pts</div>
            </div>
          </div>
        )}
      </div>

      {!loadingEletricista && !eletricista && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <UserX className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium text-foreground">Seu usuário não está vinculado a um cadastro de eletricista.</p>
            <p className="text-sm mt-1">Você pode visualizar os prêmios, mas o resgate fica disponível apenas para eletricistas cadastrados.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar prêmio..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => (
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

      {loadingPremios ? (
        <div className="text-sm text-muted-foreground py-6">Carregando prêmios…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Gift className="h-12 w-12 mx-auto mb-2 opacity-40" />
          {premios.length === 0 ? "Nenhum prêmio disponível no momento." : "Nenhum prêmio encontrado."}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((r) => {
            const semEstoque = r.estoque !== null && r.estoque <= 0;
            const canRedeem = !!eletricista && !semEstoque && saldo >= r.custo_pontos;
            return (
              <Card key={r.id} className="overflow-hidden flex flex-col">
                {r.imagem_url ? (
                  <div className="h-32 bg-gradient-to-br from-accent to-muted">
                    <img src={r.imagem_url} alt={r.nome} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-accent to-muted flex items-center justify-center text-5xl">
                    {r.emoji ?? "🎁"}
                  </div>
                )}
                <CardContent className="p-4 flex-1 flex flex-col">
                  {r.categoria && <Badge variant="outline" className="self-start text-[10px]">{r.categoria}</Badge>}
                  <h3 className="font-semibold mt-2">{r.nome}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">{r.descricao}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm font-bold">
                      <Zap className="h-4 w-4 text-energy" /> {r.custo_pontos.toLocaleString("pt-BR")}
                    </div>
                    {semEstoque && <span className="text-[10px] text-muted-foreground">Indisponível</span>}
                  </div>
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    disabled={!canRedeem || redeemingId === r.id}
                    onClick={() => resgatar(r)}
                  >
                    {redeemingId === r.id
                      ? "Resgatando…"
                      : semEstoque
                        ? "Indisponível"
                        : !eletricista
                          ? "Resgatar"
                          : canRedeem
                            ? "Resgatar"
                            : "Pontos insuficientes"}
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
