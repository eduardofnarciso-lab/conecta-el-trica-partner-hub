import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Zap, Trophy, TrendingUp, Target, ArrowUpRight, Megaphone, Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TierBadge, StatusBadge } from "@/components/badges";
import {
  currentUser, mockCampaigns, mockTransactions, monthlyPoints, TIERS, nextTier,
} from "@/lib/mocks";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
});

function Dashboard() {
  const next = nextTier(currentUser.points);
  const tierIdx = TIERS.findIndex((t) => t.name === currentUser.tier);
  const currentMin = TIERS[tierIdx].min;
  const nextMin = next?.min ?? currentUser.points;
  const progress = next
    ? Math.min(100, ((currentUser.points - currentMin) / (nextMin - currentMin)) * 100)
    : 100;
  const remaining = next ? nextMin - currentUser.points : 0;

  const highlight = mockCampaigns.find((c) => c.highlight) ?? mockCampaigns[0];
  const maxPts = Math.max(...monthlyPoints.map((m) => m.points));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Olá, {currentUser.name.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aqui está o resumo da sua jornada no Clube Conecta Elétrica.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Saldo de pontos"
          value={currentUser.points.toLocaleString("pt-BR")}
          icon={<Zap className="h-4 w-4" />}
          accent
        />
        <StatCard
          label="Categoria atual"
          value={currentUser.tier}
          icon={<Sparkles className="h-4 w-4" />}
          badge={<TierBadge tier={currentUser.tier} />}
        />
        <StatCard
          label="Posição no ranking"
          value={`${currentUser.rankPosition}º`}
          icon={<Trophy className="h-4 w-4" />}
          sub="Top 10 nacional"
        />
        <StatCard
          label="Faltam para Diamante"
          value={remaining.toLocaleString("pt-BR")}
          icon={<Target className="h-4 w-4" />}
          sub="pontos"
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
                <TierBadge tier={currentUser.tier} />
                <div className="text-2xl font-bold mt-2">
                  {currentUser.points.toLocaleString("pt-BR")} pts
                </div>
              </div>
              {next && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Próxima</div>
                  <TierBadge tier={next.name} />
                  <div className="text-xs text-muted-foreground mt-1">
                    {nextMin.toLocaleString("pt-BR")} pts
                  </div>
                </div>
              )}
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {TIERS.map((t) => (
                <span key={t.name} className={t.name === currentUser.tier ? "text-foreground font-medium" : ""}>
                  {t.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sidebar text-sidebar-foreground border-0 overflow-hidden relative">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-energy/20 blur-2xl" />
          <CardHeader className="relative">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-energy">
              <Sparkles className="h-3.5 w-3.5" /> Campanha em destaque
            </div>
            <CardTitle className="text-lg mt-2">{highlight.name}</CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-3">
            <p className="text-sm text-sidebar-foreground/70">{highlight.description}</p>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-energy" />
              <span className="font-semibold">{highlight.points}</span>
            </div>
            <Button asChild variant="secondary" className="bg-energy text-energy-foreground hover:bg-energy/90">
              <Link to="/campanhas/$id" params={{ id: highlight.id }}>
                Ver detalhes <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Chart + transactions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pontos por mês</CardTitle>
            <div className="flex items-center gap-1 text-xs text-success">
              <TrendingUp className="h-3.5 w-3.5" /> +24% vs mês anterior
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3 h-40">
              {monthlyPoints.map((m) => {
                const h = (m.points / maxPts) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-[10px] text-muted-foreground">{m.points}</div>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/70 transition-all"
                      style={{ height: `${h}%`, minHeight: 4 }}
                    />
                    <div className="text-xs text-muted-foreground">{m.month}</div>
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
            {mockTransactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(t.date).toLocaleDateString("pt-BR")} · {t.type}
                  </div>
                </div>
                <div
                  className={`text-sm font-semibold ${t.points >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {t.points > 0 ? "+" : ""}
                  {t.points}
                </div>
              </div>
            ))}
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
          <div className="grid gap-3 md:grid-cols-2">
            {mockCampaigns
              .filter((c) => c.status === "Ativa")
              .map((c) => (
                <Link
                  key={c.id}
                  to="/campanhas/$id"
                  params={{ id: c.id }}
                  className="group border border-border rounded-lg p-4 hover:border-primary/40 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold">{c.name}</div>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                    <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-energy" /> {c.points}</span>
                    <span>·</span>
                    <span>{c.period}</span>
                  </div>
                </Link>
              ))}
          </div>
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
