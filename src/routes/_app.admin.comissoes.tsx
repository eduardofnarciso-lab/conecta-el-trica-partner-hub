import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/badges";
import { mockCommissions } from "@/lib/mocks";
import { DollarSign, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/comissoes")({
  component: AdminComissoes,
});

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function AdminComissoes() {
  const open = mockCommissions.filter((c) => c.status === "Em aberto");
  const totalOpen = open.reduce((s, c) => s + c.commission, 0);
  const totalSales = mockCommissions.reduce((s, c) => s + c.salesValue, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card><CardContent className="p-5">
          <div className="text-xs text-muted-foreground">Comissões em aberto</div>
          <div className="text-2xl font-bold mt-2 text-primary">{brl(totalOpen)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-xs text-muted-foreground">Vendas (período)</div>
          <div className="text-2xl font-bold mt-2">{brl(totalSales)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-xs text-muted-foreground">Vendedores</div>
          <div className="text-2xl font-bold mt-2">3</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" /> Comissões da equipe</CardTitle>
          <Button onClick={() => toast.success("Comissões em aberto marcadas como pagas")}>
            <Check className="h-4 w-4 mr-1" /> Pagar em aberto
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 pr-3">Vendedor</th>
                  <th className="py-3 pr-3 hidden md:table-cell">Período</th>
                  <th className="py-3 pr-3 text-right">Vendas</th>
                  <th className="py-3 pr-3 text-right hidden sm:table-cell">Valor vendido</th>
                  <th className="py-3 pr-3 text-right hidden lg:table-cell">Taxa</th>
                  <th className="py-3 pr-3 text-right">Comissão</th>
                  <th className="py-3 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockCommissions.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3 font-medium">{c.seller}</td>
                    <td className="py-3 pr-3 hidden md:table-cell text-muted-foreground">{c.period}</td>
                    <td className="py-3 pr-3 text-right">{c.sales}</td>
                    <td className="py-3 pr-3 text-right hidden sm:table-cell whitespace-nowrap">{brl(c.salesValue)}</td>
                    <td className="py-3 pr-3 text-right hidden lg:table-cell text-muted-foreground">{(c.rate * 100).toFixed(0)}%</td>
                    <td className="py-3 pr-3 text-right font-semibold whitespace-nowrap">{brl(c.commission)}</td>
                    <td className="py-3 pr-3"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
