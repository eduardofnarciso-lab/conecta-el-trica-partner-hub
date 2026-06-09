import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TierBadge } from "@/components/badges";
import { mockRanking } from "@/lib/mocks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/ranking")({
  component: RankingPage,
});

function RankingPage() {
  const [tab, setTab] = useState("mensal");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Ranking de parceiros</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acompanhe sua posição entre os parceiros do Clube.
        </p>
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-2xl mx-auto items-end">
        {[1, 0, 2].map((i) => {
          const p = mockRanking[i];
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4" /> Classificação completa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="mensal">Mensal</TabsTrigger>
              <TabsTrigger value="anual">Anual</TabsTrigger>
              <TabsTrigger value="regional">Regional</TabsTrigger>
            </TabsList>
            {(["mensal", "anual", "regional"] as const).map((k) => (
              <TabsContent key={k} value={k}>
                <RankingTable />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function RankingTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
            <th className="py-3 pr-3">Posição</th>
            <th className="py-3 pr-3">Parceiro</th>
            <th className="py-3 pr-3 hidden md:table-cell">Tipo</th>
            <th className="py-3 pr-3 hidden lg:table-cell">Cidade</th>
            <th className="py-3 pr-3 text-right">Pontos</th>
            <th className="py-3 pr-3 hidden sm:table-cell">Categoria</th>
          </tr>
        </thead>
        <tbody>
          {mockRanking.map((p) => (
            <tr
              key={p.pos}
              className={cn(
                "border-b border-border last:border-0",
                p.isYou && "bg-energy/10 ring-1 ring-energy/40 ring-inset",
              )}
            >
              <td className="py-3 pr-3 font-semibold w-16">
                <span className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs",
                  p.pos <= 3 ? "bg-gold/30 text-foreground" : "bg-muted text-muted-foreground",
                )}>{p.pos}</span>
              </td>
              <td className="py-3 pr-3 font-medium">{p.name}{p.isYou && <span className="ml-2 text-xs text-primary">(você)</span>}</td>
              <td className="py-3 pr-3 hidden md:table-cell text-muted-foreground">{p.type}</td>
              <td className="py-3 pr-3 hidden lg:table-cell text-muted-foreground">{p.city}</td>
              <td className="py-3 pr-3 text-right font-semibold">{p.points.toLocaleString("pt-BR")}</td>
              <td className="py-3 pr-3 hidden sm:table-cell"><TierBadge tier={p.tier} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
