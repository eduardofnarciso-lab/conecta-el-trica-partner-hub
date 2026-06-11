import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Trophy, Megaphone, BarChart3, MapPin } from "lucide-react";

export const Route = createFileRoute("/_app/admin/relatorios")({
  component: AdminReports,
});

const NOTA_STATUS_LABEL: Record<string, string> = {
  em_analise: "Em análise",
  confirmada: "Confirmadas",
  reprovada: "Reprovadas",
};

type SaldoRow = { eletricista_id: string; nome: string; saldo: number };
type RankingRow = { campanha_id: string; campanha: string; pontos: number };

async function fetchTopEletricistas(): Promise<SaldoRow[]> {
  const { data, error } = await supabase
    .from("vw_saldo_eletricista")
    .select("eletricista_id, nome, saldo")
    .order("saldo", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as SaldoRow[];
}

async function fetchPorCidade(): Promise<{ cidade: string; total: number }[]> {
  const { data, error } = await supabase.from("eletricistas").select("cidade");
  if (error) throw error;
  const map = new Map<string, number>();
  for (const e of data ?? []) {
    const cidade = (e.cidade ?? "").trim() || "Sem cidade";
    map.set(cidade, (map.get(cidade) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([cidade, total]) => ({ cidade, total }))
    .sort((a, b) => b.total - a.total);
}

async function fetchPontosPorCampanha(): Promise<{ campanha: string; pontos: number }[]> {
  const { data, error } = await supabase
    .from("vw_ranking")
    .select("campanha_id, campanha, pontos");
  if (error) throw error;
  const map = new Map<string, { campanha: string; pontos: number }>();
  for (const r of (data ?? []) as RankingRow[]) {
    const cur = map.get(r.campanha_id);
    if (cur) cur.pontos += Number(r.pontos ?? 0);
    else map.set(r.campanha_id, { campanha: r.campanha, pontos: Number(r.pontos ?? 0) });
  }
  return [...map.values()].sort((a, b) => b.pontos - a.pontos);
}

async function fetchNotasPorStatus(): Promise<{ status: string; total: number }[]> {
  const { data, error } = await supabase.from("notas").select("status");
  if (error) throw error;
  const map = new Map<string, number>();
  for (const n of data ?? []) {
    map.set(n.status, (map.get(n.status) ?? 0) + 1);
  }
  return ["em_analise", "confirmada", "reprovada"]
    .filter((s) => map.has(s))
    .map((s) => ({ status: NOTA_STATUS_LABEL[s] ?? s, total: map.get(s)! }));
}

function AdminReports() {
  const { data: top = [], isLoading: l1 } = useQuery({ queryKey: ["rel-top-eletricistas"], queryFn: fetchTopEletricistas });
  const { data: cidades = [], isLoading: l2 } = useQuery({ queryKey: ["rel-por-cidade"], queryFn: fetchPorCidade });
  const { data: campanhas = [], isLoading: l3 } = useQuery({ queryKey: ["rel-pontos-campanha"], queryFn: fetchPontosPorCampanha });
  const { data: notasStatus = [], isLoading: l4 } = useQuery({ queryKey: ["rel-notas-status"], queryFn: fetchNotasPorStatus });

  const maxCampanha = Math.max(1, ...campanhas.map((c) => c.pontos));
  const maxCidade = Math.max(1, ...cidades.map((c) => c.total));
  const maxStatus = Math.max(1, ...notasStatus.map((n) => n.total));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Top 10 eletricistas (saldo de pontos)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {l1 ? (
              <div className="text-sm text-muted-foreground py-4">Carregando…</div>
            ) : top.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">Sem pontuações registradas ainda.</div>
            ) : (
              top.map((p, i) => (
                <div key={p.eletricista_id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-accent text-xs flex items-center justify-center font-semibold">{i + 1}</span>
                    <span className="font-medium">{p.nome}</span>
                  </div>
                  <span className="font-semibold">{Number(p.saldo).toLocaleString("pt-BR")} pts</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4" /> Pontos por campanha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {l3 ? (
              <div className="text-sm text-muted-foreground py-4">Carregando…</div>
            ) : campanhas.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">Nenhuma campanha com pontos ainda.</div>
            ) : (
              campanhas.map((c) => (
                <div key={c.campanha}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{c.campanha}</span>
                    <span className="text-muted-foreground">{c.pontos.toLocaleString("pt-BR")} pts</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-energy" style={{ width: `${(c.pontos / maxCampanha) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Notas por status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {l4 ? (
              <div className="text-sm text-muted-foreground py-4">Carregando…</div>
            ) : notasStatus.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">Nenhuma nota lançada ainda.</div>
            ) : (
              notasStatus.map((n) => (
                <div key={n.status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{n.status}</span>
                    <span className="text-muted-foreground">{n.total}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/80" style={{ width: `${(n.total / maxStatus) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Eletricistas por cidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {l2 ? (
              <div className="text-sm text-muted-foreground py-4">Carregando…</div>
            ) : cidades.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">Nenhum eletricista cadastrado ainda.</div>
            ) : (
              cidades.map((c) => (
                <div key={c.cidade}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{c.cidade}</span>
                    <span className="text-muted-foreground">{c.total}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-energy/60 to-energy" style={{ width: `${(c.total / maxCidade) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
