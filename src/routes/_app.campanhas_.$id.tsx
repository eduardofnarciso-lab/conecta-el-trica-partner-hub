import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Zap, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/badges";
import { fetchCampanha, campanhaPeriodo, campanhaPontosLabel, CAMPANHA_STATUS_LABEL } from "@/lib/campanhas";

export const Route = createFileRoute("/_app/campanhas_/$id")({
  component: CampaignDetail,
});

function CampaignDetail() {
  const { id } = Route.useParams();
  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campanha", id],
    queryFn: () => fetchCampanha(id),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando campanha…</div>;
  }
  if (!campaign) {
    return (
      <div className="p-8 text-center text-muted-foreground space-y-4">
        <p>Campanha não encontrada.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/campanhas"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar para campanhas</Link>
        </Button>
      </div>
    );
  }

  const rules =
    campaign.regras && campaign.regras.length > 0
      ? campaign.regras
      : ["Pontuação conforme compras registradas na campanha.", `Top ${campaign.premiacao_top} do ranking são premiados ao final.`];

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
            <StatusBadge status={CAMPANHA_STATUS_LABEL[campaign.status] ?? campaign.status} />
            <h1 className="text-2xl md:text-3xl font-bold mt-3">{campaign.nome}</h1>
            <p className="text-primary-foreground/80 mt-2 max-w-2xl">{campaign.descricao}</p>
          </div>
          <div className="bg-energy text-energy-foreground rounded-lg px-4 py-3 text-center">
            <div className="text-xs uppercase tracking-wider opacity-70">Recompensa</div>
            <div className="text-lg font-bold flex items-center gap-1"><Zap className="h-4 w-4" /> {campanhaPontosLabel(campaign)}</div>
          </div>
        </div>
        <div className="relative flex flex-wrap gap-4 mt-6 text-sm text-primary-foreground/80">
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {campanhaPeriodo(campaign)}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Regras da campanha</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {rules.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Período</span><span className="text-right">{campanhaPeriodo(campaign)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Premiados</span><span>Top {campaign.premiacao_top}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Status</span><StatusBadge status={CAMPANHA_STATUS_LABEL[campaign.status] ?? campaign.status} /></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
