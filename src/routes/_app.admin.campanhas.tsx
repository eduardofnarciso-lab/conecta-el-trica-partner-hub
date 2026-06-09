import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/badges";
import { mockCampaigns } from "@/lib/mocks";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/campanhas")({
  component: AdminCampaigns,
});

function AdminCampaigns() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Campanhas</CardTitle>
        <Button onClick={() => toast.info("Modal de nova campanha em breve.")}>
          <Plus className="h-4 w-4 mr-1" /> Nova campanha
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 pr-3">Nome</th>
                <th className="py-3 pr-3 hidden md:table-cell">Período</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3 text-right">Participantes</th>
                <th className="py-3 pr-3 text-right">Pontos distribuídos</th>
              </tr>
            </thead>
            <tbody>
              {mockCampaigns.map((c, i) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-3 font-medium">{c.name}</td>
                  <td className="py-3 pr-3 hidden md:table-cell text-muted-foreground">{c.period}</td>
                  <td className="py-3 pr-3"><StatusBadge status={c.status} /></td>
                  <td className="py-3 pr-3 text-right">{(120 + i * 47).toLocaleString("pt-BR")}</td>
                  <td className="py-3 pr-3 text-right font-semibold">{(45000 + i * 12000).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
