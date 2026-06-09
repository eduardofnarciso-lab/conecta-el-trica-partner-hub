import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockRewards } from "@/lib/mocks";
import { Plus, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/premios")({
  component: AdminRewards,
});

function AdminRewards() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Prêmios</CardTitle>
        <Button onClick={() => toast.info("Modal de novo prêmio em breve.")}>
          <Plus className="h-4 w-4 mr-1" /> Novo prêmio
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 pr-3">Nome</th>
                <th className="py-3 pr-3">Categoria</th>
                <th className="py-3 pr-3 text-right">Custo</th>
                <th className="py-3 pr-3 text-right">Estoque</th>
                <th className="py-3 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockRewards.map((r, i) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-3 font-medium flex items-center gap-2"><span className="text-xl">{r.emoji}</span> {r.name}</td>
                  <td className="py-3 pr-3"><Badge variant="outline">{r.category}</Badge></td>
                  <td className="py-3 pr-3 text-right font-semibold flex items-center justify-end gap-1"><Zap className="h-3 w-3 text-energy" />{r.cost.toLocaleString("pt-BR")}</td>
                  <td className="py-3 pr-3 text-right">{r.available ? (50 - i * 3) : 0}</td>
                  <td className="py-3 pr-3">
                    {r.available ? <Badge className="bg-success text-success-foreground">Disponível</Badge> : <Badge variant="secondary">Esgotado</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
