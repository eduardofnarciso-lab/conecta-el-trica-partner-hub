import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Zap, Clock, Megaphone, Receipt, FileClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/badges";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/admin/")({
  component: AdminOverview,
});

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

const NOTA_STATUS_LABEL: Record<string, string> = {
  em_analise: "Em análise",
  confirmada: "Confirmada",
  reprovada: "Reprovada",
};

type Overview = {
  eletricistasAtivos: number;
  campanhasAtivas: number;
  notasEmAnalise: number;
  pontosNoMes: number;
  valorNotasNoMes: number;
  resgatesSolicitados: number;
  notasAprovadas: number;
  notasRecusadas: number;
};

type UltimaNota = {
  id: string;
  numero_nota: string | null;
  valor: number;
  pontos: number;
  status: string;
  data_compra: string;
  eletricista: { nome: string } | null;
};

async function fetchOverview(): Promise<Overview> {
  const now = new Date();
  const inicioMesISO = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const inicioMesData = inicioMesISO.slice(0, 10);

  const [eletricistas, campanhas, notasAnalise, transacoes, notasMes, resgates, aprovadas, recusadas] = await Promise.all([
    supabase.from("eletricistas").select("id", { count: "exact", head: true }).eq("status", "ativo"),
    supabase.from("campanhas").select("id", { count: "exact", head: true }).eq("status", "ativa"),
    supabase.from("notas").select("id", { count: "exact", head: true }).eq("status", "em_analise"),
    supabase
      .from("transacoes_pontos")
      .select("pontos")
      .eq("tipo", "ganho")
      .eq("status", "confirmado")
      .gte("created_at", inicioMesISO),
    supabase
      .from("nota_itens")
      .select("valor, nota:notas!inner(status, data_compra)")
      .eq("elegivel", true)
      .eq("nota.status", "confirmada")
      .gte("nota.data_compra", inicioMesData),
    supabase.from("resgates").select("id", { count: "exact", head: true }).eq("status", "solicitado"),
    supabase.from("notas").select("id", { count: "exact", head: true }).eq("status", "confirmada"),
    supabase.from("notas").select("id", { count: "exact", head: true }).eq("status", "reprovada"),
  ]);

  for (const r of [eletricistas, campanhas, notasAnalise, transacoes, notasMes, resgates, aprovadas, recusadas]) {
    if (r.error) throw r.error;
  }

  return {
    eletricistasAtivos: eletricistas.count ?? 0,
    campanhasAtivas: campanhas.count ?? 0,
    notasEmAnalise: notasAnalise.count ?? 0,
    pontosNoMes: (transacoes.data ?? []).reduce((s, t) => s + (t.pontos ?? 0), 0),
    valorNotasNoMes: (notasMes.data ?? []).reduce((s, n) => s + Number(n.valor ?? 0), 0),
    resgatesSolicitados: resgates.count ?? 0,
    notasAprovadas: aprovadas.count ?? 0,
    notasRecusadas: recusadas.count ?? 0,
  };
}

async function fetchUltimasNotas(): Promise<UltimaNota[]> {
  const { data, error } = await supabase
    .from("notas")
    .select("id, numero_nota, valor, pontos, status, data_compra, eletricista:eletricistas(nome)")
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return (data ?? []) as unknown as UltimaNota[];
}

function AdminOverview() {
  const { data: ov, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: fetchOverview });
  const { data: ultimas = [], isLoading: loadingNotas } = useQuery({
    queryKey: ["admin-ultimas-notas"],
    queryFn: fetchUltimasNotas,
  });

  const fmt = (v: number | undefined, f?: (n: number) => string) =>
    isLoading || v === undefined ? "—" : f ? f(v) : v.toLocaleString("pt-BR");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Eletricistas ativos" value={fmt(ov?.eletricistasAtivos)} icon={<Users className="h-4 w-4" />} />
        <Kpi label="Campanhas ativas" value={fmt(ov?.campanhasAtivas)} icon={<Megaphone className="h-4 w-4" />} />
        <Kpi label="Notas em análise" value={fmt(ov?.notasEmAnalise)} icon={<FileClock className="h-4 w-4" />} />
        <Kpi label="Pontos no mês" value={fmt(ov?.pontosNoMes)} icon={<Zap className="h-4 w-4" />} />
        <Kpi label="Valor em campanha no mês" value={fmt(ov?.valorNotasNoMes, brl)} icon={<Receipt className="h-4 w-4" />} />
        <Kpi label="Notas aprovadas" value={fmt(ov?.notasAprovadas)} icon={<Receipt className="h-4 w-4" />} />
        <Kpi label="Notas recusadas" value={fmt(ov?.notasRecusadas)} icon={<Receipt className="h-4 w-4" />} />
        <Kpi label="Resgates solicitados" value={fmt(ov?.resgatesSolicitados)} icon={<Clock className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Últimas notas lançadas</CardTitle>
          <Link to="/admin/notas" className="text-xs text-primary hover:underline">
            Ver todas
          </Link>
        </CardHeader>
        <CardContent>
          {loadingNotas ? (
            <div className="text-sm text-muted-foreground py-6">Carregando…</div>
          ) : ultimas.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6">
              Nenhuma nota lançada ainda. As compras dos eletricistas vão aparecer aqui.
            </div>
          ) : (
            <div className="space-y-3">
              {ultimas.map((n) => (
                <div key={n.id} className="flex items-center justify-between gap-3 border border-border rounded-lg p-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{n.eletricista?.nome ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {n.numero_nota ? `NF ${n.numero_nota} · ` : ""}
                      {n.data_compra?.split("-").reverse().join("/")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold">{brl(Number(n.valor))}</div>
                      <div className="text-xs text-muted-foreground">{n.pontos.toLocaleString("pt-BR")} pts</div>
                    </div>
                    <StatusBadge status={NOTA_STATUS_LABEL[n.status] ?? n.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="h-7 w-7 rounded-md bg-accent flex items-center justify-center text-primary">{icon}</span>
        </div>
        <div className="text-2xl font-bold mt-3">{value}</div>
      </CardContent>
    </Card>
  );
}
