import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/badges";
import { mockCampaigns } from "@/lib/mocks";

export const Route = createFileRoute("/_app/campanhas")({
  component: CampaignsPage,
});

function CampaignsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Campanhas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acumule pontos participando das campanhas ativas.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mockCampaigns.map((c) => (
          <Card key={c.id} className="flex flex-col overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-primary via-primary/80 to-sidebar relative">
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <Zap className="h-6 w-6 text-energy" />
                <StatusBadge status={c.status} />
              </div>
            </div>
            <CardContent className="p-5 flex-1 flex flex-col">
              <h3 className="font-semibold text-base">{c.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-3 flex-1">
                {c.description}
              </p>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {c.period}</div>
                <div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-energy" /> {c.points}</div>
              </div>
              <Button asChild className="mt-4 w-full" variant="secondary">
                <Link to="/campanhas/$id" params={{ id: c.id }}>
                  Ver detalhes <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
