import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Crown, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/badges";
import { supabase } from "@/lib/supabase";
function currentTier(points: number, niveis: { nome: string; pontos_min: number }[]): string {
  let cur = niveis[0]?.nome ?? "Bronze";
  for (const t of niveis) if (points >= t.pontos_min) cur = t.nome;
  return cur;
}
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/ranking")({
  component: RankingPage,
});

type RankRow = {
  pos: number;
  name: string;
  city: string | null;
  points: number;
  tier: string;
  prize: boolean;
};

async function fetchRanking(): Promise<{ campanha: string | null; rows: RankRow[] }> {
  const { data: camp } = await supabase
    .from("campanhas")
    .select("id,nome")
    .eq("status", "ativa")
    .order("data_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();

  let query = supabase.from("vw_ranking").select("*").order("posicao", { ascending: true });
  if (camp?.id) query = query.eq("campanha_id", camp.id);
  const { data, error } = await query;
  if (error) throw error;

  const { data: niveisData } = await supabase.from("niveis").select("nome, pontos_min").order("ordem");
  const niveis = niveisData ?? [];

  const rows: RankRow[] = (data ?? []).map((r: any) => ({
    pos: Number(r.posicao),
    name: r.nome,
    city: r.cidade,
    points: Number(r.pontos),
    tier: currentTier(Number(r.pontos), niveis),
    prize: Boolean(r.premiado),
  }));
  return { campanha: camp?.nome ?? null, rows };
}

function RankingPage() {
  const { data, isLoading } = useQuery({ queryKey: ["ranking"], queryFn: fetchRanking });
  const rows = data?.rows ?? [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Ranking de eletricistas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {data?.campanha ? `Campanha ${data.campanha} · ` : ""}
          os <span className="font-medium text-foreground">10 primeiros</span> são premiados ao fim da campanha.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando ranking…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">Nenhuma pontuação registrada ainda.</div>
      ) : (
        <>
          {/* Pódio */}
          {rows.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-2xl mx-auto items-end">
              {[1, 0, 2].map((i) => {
                const p = rows[i];
                const heights = ["h-24", "h-32", "h-20"];
                const colors = ["bg-silver/60", "bg-gold/70", "bg-bronze/50"];
                return (
                  <div key={p.pos} className="text-center">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.points.toLocaleString("pt-BR")} pts</div>
                    <div className={cn("mt-2 rounded-t-lg flex items-center justify-center text-2xl font-bold", heights[i === 1 ? 0 : i === 0 ? 1 : 2], colors[i === 1 ? 0 : i === 0 ? 1 : 2])}>
                      {i === 0 && <Crown className="h-5 w-5 mr-1 text-energy" />}
                      {p.pos}º
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Classificação completa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                      <th className="py-3 pr-3">Posição</th>
                      <th className="py-3 pr-3">Eletricista</th>
                      <th className="py-3 pr-3 hidden lg:table-cell">Cidade</th>
                      <th className="py-3 pr-3 text-right">Pontos</th>
                      <th className="py-3 pr-3 hidden sm:table-cell">Categoria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => (
                      <tr key={p.pos} className="border-b border-border last:border-0">
                        <td className="py-3 pr-3 font-semibold w-16">
                          <span className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs",
                            p.pos <= 3 ? "bg-gold/30 text-foreground" : "bg-muted text-muted-foreground",
                          )}>{p.pos}</span>
                        </td>
                        <td className="py-3 pr-3 font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            {p.name}
                            {p.prize && <Gift className="h-3.5 w-3.5 text-energy" aria-label="Premiado" />}
                          </span>
                        </td>
                        <td className="py-3 pr-3 hidden lg:table-cell text-muted-foreground">{p.city}</td>
                        <td className="py-3 pr-3 text-right font-semibold">{p.points.toLocaleString("pt-BR")}</td>
                        <td className="py-3 pr-3 hidden sm:table-cell"><TierBadge tier={p.tier} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
