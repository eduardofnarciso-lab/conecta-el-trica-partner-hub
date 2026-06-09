import { createFileRoute } from "@tanstack/react-router";
import { Users, Zap, Clock, Megaphone, TrendingUp, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/badges";
import { adminOverview, mockRanking, monthlyPoints } from "@/lib/mocks";

export const Route = createFileRoute("/_app/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const maxPts = Math.max(...monthlyPoints.map((m) => m.points));
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total de parceiros" value={adminOverview.totalPartners.toLocaleString("pt-BR")} icon={<Users className="h-4 w-4" />} delta="+8% mês" />
        <Kpi label="Pontos distribuídos" value={adminOverview.pointsThisMonth.toLocaleString("pt-BR")} icon={<Zap className="h-4 w-4" />} delta="+12%" />
        <Kpi label="Resgates pendentes" value={String(adminOverview.pendingRedemptions)} icon={<Clock className="h-4 w-4" />} delta="3 hoje" />
        <Kpi label="Campanhas ativas" value={String(adminOverview.activeCampaigns)} icon={<Megaphone className="h-4 w-4" />} delta="2 novas" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Engajamento mensal</CardTitle>
            <div className="text-xs text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +24%</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3 h-48">
              {monthlyPoints.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-[10px] text-muted-foreground">{m.points}</div>
                  <div className="w-full rounded-t-md bg-gradient-to-t from-primary to-energy/70" style={{ height: `${(m.points / maxPts) * 100}%` }} />
                  <div className="text-xs text-muted-foreground">{m.month}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4" /> Top parceiros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockRanking.slice(0, 5).map((p) => (
              <div key={p.pos} className="flex items-center gap-3">
                <span className="h-7 w-7 rounded-full bg-accent text-xs font-semibold flex items-center justify-center">{p.pos}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.type}</div>
                </div>
                <TierBadge tier={p.tier} className="text-[10px]" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon, delta }: { label: string; value: string; icon: React.ReactNode; delta: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="h-7 w-7 rounded-md bg-accent flex items-center justify-center text-primary">{icon}</span>
        </div>
        <div className="text-2xl font-bold mt-3">{value}</div>
        <div className="text-xs text-success mt-1">{delta}</div>
      </CardContent>
    </Card>
  );
}
