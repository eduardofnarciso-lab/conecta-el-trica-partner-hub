import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/badges";
import { mockPurchases } from "@/lib/mocks";
import { Plus, Search, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/notas")({
  component: AdminNotas,
});

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function AdminNotas() {
  const [q, setQ] = useState("");
  const list = mockPurchases.filter((p) => p.partner.toLowerCase().includes(q.toLowerCase()));
  const totalValue = list.reduce((s, p) => s + p.value, 0);
  const totalPoints = list.reduce((s, p) => s + (p.status === "Confirmada" ? p.points : 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card><CardContent className="p-5">
          <div className="text-xs text-muted-foreground">Notas lançadas</div>
          <div className="text-2xl font-bold mt-2">{list.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-xs text-muted-foreground">Valor total</div>
          <div className="text-2xl font-bold mt-2">{brl(totalValue)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-xs text-muted-foreground">Pontos confirmados</div>
          <div className="text-2xl font-bold mt-2 text-primary">{totalPoints.toLocaleString("pt-BR")}</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">Lançamento de Notas (Compras dos eletricistas)</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar eletricista..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={() => toast.success("Abrir formulário de lançamento de nota")}>
              <Plus className="h-4 w-4 mr-1" /> Lançar nota
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 pr-3">Data</th>
                  <th className="py-3 pr-3">Eletricista</th>
                  <th className="py-3 pr-3 hidden md:table-cell">Segmento</th>
                  <th className="py-3 pr-3 hidden lg:table-cell">Vendedor</th>
                  <th className="py-3 pr-3 text-right">Valor</th>
                  <th className="py-3 pr-3 text-right">Pontos</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">{new Date(p.date).toLocaleDateString("pt-BR")}</td>
                    <td className="py-3 pr-3 font-medium">{p.partner}</td>
                    <td className="py-3 pr-3 hidden md:table-cell text-muted-foreground">{p.segment}</td>
                    <td className="py-3 pr-3 hidden lg:table-cell text-muted-foreground">{p.seller}</td>
                    <td className="py-3 pr-3 text-right whitespace-nowrap">{brl(p.value)}</td>
                    <td className="py-3 pr-3 text-right font-semibold">{p.points.toLocaleString("pt-BR")}</td>
                    <td className="py-3 pr-3"><StatusBadge status={p.status} /></td>
                    <td className="py-3 pr-3">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => toast.success(`Nota de ${p.partner} confirmada`)}><CheckCircle2 className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => toast.error(`Nota de ${p.partner} reprovada`)}><XCircle className="h-4 w-4" /></Button>
                      </div>
                    </td>
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
