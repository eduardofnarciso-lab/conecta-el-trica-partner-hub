import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TierBadge, StatusBadge } from "@/components/badges";
import { adminPartners, type Tier } from "@/lib/mocks";
import { Eye, Pencil, Ban, Search, Unlock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/parceiros")({
  component: AdminPartners,
});

type Partner = (typeof adminPartners)[number];

function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>(adminPartners);
  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState<Partner | null>(null);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState({ name: "", city: "", tier: "Bronze", points: 0 });

  const list = partners.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  const openEdit = (p: Partner) => {
    setForm({ name: p.name, city: p.city, tier: p.tier, points: p.points });
    setEditing(p);
  };

  const saveEdit = () => {
    if (!editing) return;
    if (!form.name.trim()) {
      toast.error("Informe o nome do parceiro.");
      return;
    }
    setPartners((prev) =>
      prev.map((p) =>
        p.id === editing.id
          ? { ...p, name: form.name.trim(), city: form.city.trim(), tier: form.tier as Tier, points: Number(form.points) || 0 }
          : p,
      ),
    );
    setEditing(null);
    toast.success(`Parceiro ${form.name} atualizado.`);
  };

  const toggleBlock = (p: Partner) => {
    const blocked = p.status === "Bloqueado";
    setPartners((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, status: blocked ? "Ativo" : "Bloqueado" } : x)),
    );
    blocked ? toast.success(`Parceiro ${p.name} desbloqueado.`) : toast.error(`Parceiro ${p.name} bloqueado.`);
  };

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
                      <Button size="icon" variant="ghost" title="Ver detalhes" onClick={() => setViewing(p)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Editar" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={p.status === "Bloqueado" ? "Desbloquear" : "Bloquear"}
                        onClick={() => toggleBlock(p)}
                      >
                        {p.status === "Bloqueado" ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Ver detalhes */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
            <DialogDescription>Detalhes do parceiro</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span>{viewing.type}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cidade</span><span>{viewing.city}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Categoria</span><TierBadge tier={viewing.tier} /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pontos</span><span className="font-semibold">{viewing.points.toLocaleString("pt-BR")}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Status</span><StatusBadge status={viewing.status} /></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar parceiro</DialogTitle>
            <DialogDescription>Altere os dados e salve.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Nome</Label>
              <Input id="edit-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-city">Cidade</Label>
              <Input id="edit-city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={form.tier} onValueChange={(v) => setForm((f) => ({ ...f, tier: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Bronze", "Prata", "Ouro", "Diamante"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-points">Pontos</Label>
                <Input
                  id="edit-points"
                  type="number"
                  min={0}
                  value={form.points}
                  onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
