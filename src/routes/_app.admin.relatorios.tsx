import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockRanking, mockRewards, monthlyPoints, reportCityEngagement, mockCampaigns } from "@/lib/mocks";
import { Trophy, Megaphone, Gift, BarChart3, MapPin } from "lucide-react";

export const Route = createFileRoute("/_app/admin/relatorios")({
  component: AdminReports,
});

function AdminReports() {
  const maxPts = Math.max(...monthlyPoints.map((m) => m.points));
  const maxCity = Math.max(...reportCityEngagement.map((c) => c.value));
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4" /> Parceiros mais ativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockRanking.slice(0, 5).map((p) => (
              <div key={p.pos} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-accent text-xs flex items-center justify-center font-semibold">{p.pos}</span>
                  <span className="font-medium">{p.name}</span>
                </div>
                <span className="font-semibold">{p.points.toLocaleString("pt-BR")} pts</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4" /> Campanhas com melhor desempenho</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockCampaigns.slice(0, 4).map((c, i) => (
              <div key={c.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">{(95 - i * 12)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-energy" style={{ width: `${95 - i * 12}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Gift className="h-4 w-4" /> Prêmios mais resgatados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockRewards.slice(0, 5).map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 text-sm">
                <span className="text-xl">{r.emoji}</span>
                <span className="flex-1 font-medium">{r.name}</span>
                <span className="text-muted-foreground">{120 - i * 18} resgates</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Pontos por mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-40">
              {monthlyPoints.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t-md bg-primary/80" style={{ height: `${(m.points / maxPts) * 100}%` }} />
                  <div className="text-xs text-muted-foreground">{m.month}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Engajamento por cidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportCityEngagement.map((c) => (
              <div key={c.city}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{c.city}</span>
                  <span className="text-muted-foreground">{c.value}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-energy/60 to-energy" style={{ width: `${(c.value / maxCity) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
