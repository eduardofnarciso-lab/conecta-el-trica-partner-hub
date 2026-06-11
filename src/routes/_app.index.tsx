import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Zap, Target, ArrowUpRight, Megaphone, Sparkles, CalendarDays, UserX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TierBadge, StatusBadge } from "@/components/badges";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import {
  fetchCampanhasPublicas, campanhaPeriodo, campanhaPontosLabel, CAMPANHA_STATUS_LABEL,
} from "@/lib/campanhas";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
});

type Nivel = { id: string; nome: string; pontos_min: number; ordem: number };
type Transacao = {
  id: string;
  tipo: string;
  pontos: number;
  descricao: string | null;
  origem: string | null;
  status: string;
  created_at: string;
};

const TIPO_LABEL: Record<string, string> = {
  ganho: "Ganho",
  resgate: "Resgate",
  ajuste: "Ajuste",
  estorno: "Estorno",
};

function Dashboard() {
  const { profile } = useAuth();

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

  const { data: niveis = [] } = useQuery({
    queryKey: ["niveis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("niveis")
        .select("id, nome, pontos_min, ordem")
        .order("pontos_min", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Nivel[];
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

  const { data: transacoes = [] } = useQuery({
    queryKey: ["transacoes-dashboard", eletricista?.id],
    enabled: !!eletricista?.id,
    queryFn: async () => {
      const inicio = new Date();
      inicio.setMonth(inicio.getMonth() - 5);
      inicio.setDate(1);
      inicio.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("transacoes_pontos")
        .select("id, tipo, pontos, descricao, origem, status, created_at")
        .eq("eletricista_id", eletricista!.id)
        .neq("status", "cancelado")
        .gte("created_at", inicio.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Transacao[];
    },
  });

  const { data: campanhas = [] } = useQuery({
    queryKey: ["campanhas-publicas"],
    queryFn: fetchCampanhasPublicas,
  });

  const nivelAtual = useMemo(() => {
    let atual: Nivel | null = null;
    for (const n of niveis) if (saldo >= n.pontos_min) atual = n;
    return atual ?? niveis[0] ?? null;
  }, [niveis, saldo]);

  const proximoNivel = useMemo(
    () => niveis.find((n) => n.pontos_min > saldo) ?? null,
    [niveis, saldo],
  );

  const currentMin = nivelAtual?.pontos_min ?? 0;
  const nextMin = proximoNivel?.pontos_min ?? saldo;
  const progress = proximoNivel
    ? Math.min(100, ((saldo - currentMin) / Math.max(1, nextMin - currentMin)) * 100)
    : 100;
  const remaining = proximoNivel ? Math.max(0, nextMin - saldo) : 0;

  const monthly = useMemo(() => {
    const months: { key: string; label: string; points: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      months.push({ key, label, points: 0 });
    }
    for (const t of transacoes) {
      if (t.status !== "confirmado" || t.pontos <= 0) continue;
      const d = new Date(t.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const m = months.find((x) => x.key === key);
      if (m) m.points += t.pontos;
    }
    return months;
  }, [transacoes]);

  const maxPts = Math.max(1, ...monthly.map((m) => m.points));
  const pontosNoMes = monthly[monthly.length - 1]?.points ?? 0;

  const ultimas = transacoes.slice(0, 5);
  const ativas = campanhas.filter((c) => c.status === "ativa");
  const highlight = campanhas.find((c) => c.destaque && c.status === "ativa")
    ?? campanhas.find((c) => c.destaque)
    ?? ativas[0]
    ?? campanhas[0]
    ?? null;

  const firstName = (eletricista?.nome ?? profile?.nome ?? "").split(" ")[0];

  if (loadingEletricista || !profile) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (!eletricista) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Olá, {firstName} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bem-vindo ao Clube de Pontos Elettro Ponto.
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <UserX className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium text-foreground">Seu usuário não está vinculado a um cadastro de eletricista.</p>
            <p className="text-sm mt-1">Saldo, extrato e resgates ficam disponíveis apenas para eletricistas cadastrados.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Olá, {firstName} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aqui está o resumo da campanha no Clube de Pontos Elettro Ponto.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Saldo de pontos"
          value={saldo.toLocaleString("pt-BR")}
          icon={<Zap className="h-4 w-4" />}
          accent
        />
        <StatCard
          label="Categoria atual"
          value={nivelAtual?.nome ?? "—"}
          icon={<Sparkles className="h-4 w-4" />}
          badge={nivelAtual ? <TierBadge tier={nivelAtual.nome} /> : undefined}
        />
        <StatCard
          label="Pontos neste mês"
          value={pontosNoMes.toLocaleString("pt-BR")}
          icon={<CalendarDays className="h-4 w-4" />}
          sub="pontos confirmados"
        />
        <StatCard
          label={proximoNivel ? `Faltam para ${proximoNivel.nome}` : "Categoria máxima"}
          value={proximoNivel ? remaining.toLocaleString("pt-BR") : "🏆"}
          icon={<Target className="h-4 w-4" />}
          sub={proximoNivel ? "pontos" : "Você chegou ao topo!"}
        />
      </div>

      {/* Tier progress + highlight */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Progresso da categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                {nivelAtual && <TierBadge tier={nivelAtual.nome} />}
                <div className="text-2xl font-bold mt-2">
                  {saldo.toLocaleString("pt-BR")} pts
                </div>
              </div>
              {proximoNivel && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Próxima</div>
                  <TierBadge tier={proximoNivel.nome} />
                  <div className="text-xs text-muted-foreground mt-1">
                    {nextMin.toLocaleString("pt-BR")} pts
                  </div>
                </div>
              )}
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {niveis.map((n) => (
                <span key={n.id} className={n.id === nivelAtual?.id ? "text-foreground font-medium" : ""}>
                  {n.nome}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {highlight ? (
          <Card className="bg-sidebar text-sidebar-foreground border-0 overflow-hidden relative">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-energy/20 blur-2xl" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-energy">
                <Sparkles className="h-3.5 w-3.5" /> Campanha em destaque
              </div>
              <CardTitle className="text-lg mt-2">{highlight.nome}</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-3">
              <p className="text-sm text-sidebar-foreground/70">{highlight.descricao}</p>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-energy" />
                <span className="font-semibold">{campanhaPontosLabel(highlight)}</span>
              </div>
              <Button asChild variant="secondary" className="bg-energy text-energy-foreground hover:bg-energy/90">
                <Link to="/campanhas/$id" params={{ id: highlight.id }}>
                  Ver detalhes <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campanha em destaque</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Nenhuma campanha em destaque no momento.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chart + transactions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pontos por mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3 h-40">
              {monthly.map((m) => {
                const h = (m.points / maxPts) * 100;
                return (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-[10px] text-muted-foreground">{m.points.toLocaleString("pt-BR")}</div>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/70 transition-all"
                      style={{ height: `${h}%`, minHeight: 4 }}
                    />
                    <div className="text-xs text-muted-foreground">{m.label}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas movimentações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ultimas.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma transação ainda.
              </div>
            ) : (
              ultimas.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{t.descricao ?? t.origem ?? TIPO_LABEL[t.tipo] ?? t.tipo}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString("pt-BR")} · {TIPO_LABEL[t.tipo] ?? t.tipo}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold ${t.pontos >= 0 ? "text-success" : "text-destructive"}`}
                  >
                    {t.pontos > 0 ? "+" : ""}
                    {t.pontos.toLocaleString("pt-BR")}
                  </div>
                </div>
              ))
            )}
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link to="/extrato">Ver extrato completo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active campaigns */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4" /> Campanhas ativas
            </CardTitle>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/campanhas">Ver todas</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {ativas.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma campanha ativa no momento.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {ativas.map((c) => (
                <Link
                  key={c.id}
                  to="/campanhas/$id"
                  params={{ id: c.id }}
                  className="group border border-border rounded-lg p-4 hover:border-primary/40 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold">{c.nome}</div>
                    <StatusBadge status={CAMPANHA_STATUS_LABEL[c.status] ?? c.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.descricao}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                    <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-energy" /> {campanhaPontosLabel(c)}</span>
                    <span>·</span>
                    <span>{campanhaPeriodo(c)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label, value, icon, sub, badge, accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
  badge?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground border-0" : ""}>
      <CardContent className="p-5">
        <div className={`flex items-center justify-between text-xs ${accent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          <span>{label}</span>
          <span className={`h-7 w-7 rounded-md flex items-center justify-center ${accent ? "bg-energy text-energy-foreground" : "bg-accent"}`}>
            {icon}
          </span>
        </div>
        <div className="mt-3 text-2xl font-bold">{value}</div>
        {sub && <div className={`text-xs mt-1 ${accent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{sub}</div>}
        {badge && <div className="mt-2">{badge}</div>}
      </CardContent>
    </Card>
  );
}
