import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Zap, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/badges";
import { mockCampaigns } from "@/lib/mocks";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/campanhas/$id")({
  loader: ({ params }) => {
    const campaign = mockCampaigns.find((c) => c.id === params.id);
    if (!campaign) throw notFound();
    return { campaign };
  },
  component: CampaignDetail,
  notFoundComponent: () => (
    <div className="p-8 text-center text-muted-foreground">Campanha não encontrada.</div>
  ),
});

function CampaignDetail() {
  const { campaign } = Route.useLoaderData();
  const history = [
    { date: "2026-06-07", action: "Pontos creditados", value: 500 },
    { date: "2026-05-22", action: "Pontos creditados", value: 800 },
    { date: "2026-05-10", action: "Inscrição confirmada", value: 0 },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/campanhas"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link>
      </Button>

      <div className="rounded-xl bg-gradient-to-br from-primary via-primary/85 to-sidebar text-primary-foreground p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <div className="relative flex items-start justify-between flex-wrap gap-3">
          <div>
            <StatusBadge status={campaign.status} />
            <h1 className="text-2xl md:text-3xl font-bold mt-3">{campaign.name}</h1>
            <p className="text-primary-foreground/80 mt-2 max-w-2xl">{campaign.description}</p>
          </div>
          <div className="bg-energy text-energy-foreground rounded-lg px-4 py-3 text-center">
            <div className="text-xs uppercase tracking-wider opacity-70">Recompensa</div>
            <div className="text-lg font-bold flex items-center gap-1"><Zap className="h-4 w-4" /> {campaign.points}</div>
          </div>
        </div>
        <div className="relative flex flex-wrap gap-4 mt-6 text-sm text-primary-foreground/80">
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {campaign.period}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Regras da campanha</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {campaign.rules.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <Button
              className="mt-6"
              onClick={() => toast.success("Você está participando da campanha!")}
              disabled={campaign.status !== "Ativa"}
            >
              {campaign.status === "Ativa" ? "Participar" : campaign.status}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                <div>
                  <div className="font-medium">{h.action}</div>
                  <div className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString("pt-BR")}</div>
                </div>
                {h.value > 0 && <div className="text-success font-semibold">+{h.value}</div>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
