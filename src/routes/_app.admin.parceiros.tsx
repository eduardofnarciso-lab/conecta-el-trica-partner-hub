import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TierBadge, StatusBadge } from "@/components/badges";
import { adminPartners } from "@/lib/mocks";
import { Eye, Pencil, Ban, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/parceiros")({
  component: AdminPartners,
});

function AdminPartners() {
  const [q, setQ] = useState("");
  const list = adminPartners.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <CardTitle className="text-base">Parceiros</CardTitle>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar parceiro..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 pr-3">Nome</th>
                <th className="py-3 pr-3 hidden md:table-cell">Tipo</th>
                <th className="py-3 pr-3 hidden lg:table-cell">Cidade</th>
                <th className="py-3 pr-3">Categoria</th>
                <th className="py-3 pr-3 text-right">Pontos</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-3 font-medium">{p.name}</td>
                  <td className="py-3 pr-3 hidden md:table-cell text-muted-foreground">{p.type}</td>
                  <td className="py-3 pr-3 hidden lg:table-cell text-muted-foreground">{p.city}</td>
                  <td className="py-3 pr-3"><TierBadge tier={p.tier} /></td>
                  <td className="py-3 pr-3 text-right font-semibold">{p.points.toLocaleString("pt-BR")}</td>
                  <td className="py-3 pr-3"><StatusBadge status={p.status} /></td>
                  <td className="py-3 pr-3">
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" onClick={() => toast.info(`Ver ${p.name}`)}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => toast.info(`Editar ${p.name}`)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => toast.error(`Parceiro ${p.name} bloqueado`)}><Ban className="h-4 w-4" /></Button>
                    </div>
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
