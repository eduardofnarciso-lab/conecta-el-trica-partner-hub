import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/badges";
import { supabase } from "@/lib/supabase";
import { Eye, Pencil, Ban, Search, Unlock, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/parceiros")({
  component: AdminPartners,
});

const STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  bloqueado: "Bloqueado",
  pendente: "Em análise",
};

type Eletricista = {
  id: string;
  nome: string;
  apelido: string | null;
  telefone: string | null;
  email: string | null;
  cidade: string | null;
  uf: string | null;
  segmento: string | null;
  status: string;
  observacoes: string | null;
};

async function fetchEletricistas(): Promise<Eletricista[]> {
  const { data, error } = await supabase
    .from("eletricistas")
    .select("id, nome, apelido, telefone, email, cidade, uf, segmento, status, observacoes")
    .order("nome");
  if (error) throw error;
  return (data ?? []) as Eletricista[];
}

function AdminPartners() {
  const queryClient = useQueryClient();
  const { data: parceiros = [], isLoading } = useQuery({
    queryKey: ["admin-eletricistas"],
    queryFn: fetchEletricistas,
  });
  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState<Eletricista | null>(null);
  const [editing, setEditing] = useState<Eletricista | null>(null);
  const [novoOpen, setNovoOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", telefone: "", cidade: "", status: "ativo" });
  const [saving, setSaving] = useState(false);

  const list = parceiros.filter((p) => p.nome.toLowerCase().includes(q.toLowerCase()));

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-eletricistas"] });

  const { data: saldoView } = useQuery({
    queryKey: ["saldo-eletricista", viewing?.id],
    enabled: !!viewing,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_saldo_eletricista")
        .select("saldo")
        .eq("eletricista_id", viewing!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.saldo ?? 0;
    },
  });

  const openEdit = (p: Eletricista) => {
    setForm({ nome: p.nome, telefone: p.telefone ?? "", cidade: p.cidade ?? "", status: p.status });
    setEditing(p);
  };

  async function saveEdit() {
    if (!editing) return;
    if (!form.nome.trim()) {
      toast.error("Informe o nome do parceiro.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("eletricistas")
      .update({
        nome: form.nome.trim(),
        telefone: form.telefone.trim() || null,
        cidade: form.cidade.trim() || null,
        status: form.status,
      })
      .eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar: " + error.message);
      return;
    }
    setEditing(null);
    toast.success(`Parceiro ${form.nome.trim()} atualizado.`);
    refresh();
  }

  async function toggleBlock(p: Eletricista) {
    const novoStatus = p.status === "bloqueado" ? "ativo" : "bloqueado";
    const { error } = await supabase.from("eletricistas").update({ status: novoStatus }).eq("id", p.id);
    if (error) {
      toast.error("Não foi possível atualizar: " + error.message);
      return;
    }
    novoStatus === "ativo"
      ? toast.success(`Parceiro ${p.nome} desbloqueado.`)
      : toast.error(`Parceiro ${p.nome} bloqueado.`);
    refresh();
  }

  async function criarParceiro() {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do parceiro.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("eletricistas").insert({
      nome: form.nome.trim(),
      telefone: form.telefone.trim() || null,
      cidade: form.cidade.trim() || null,
      status: "ativo",
    });
    setSaving(false);
    if (error) {
      toast.error("Não foi possível cadastrar: " + error.message);
      return;
    }
    setNovoOpen(false);
    toast.success(`Parceiro ${form.nome.trim()} cadastrado.`);
    refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <CardTitle className="text-base">Parceiros (Eletricistas)</CardTitle>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar parceiro..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Dialog
            open={novoOpen}
            onOpenChange={(o) => {
              setNovoOpen(o);
              if (o) setForm({ nome: "", telefone: "", cidade: "", status: "ativo" });
            }}
          >
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Novo parceiro</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo parceiro</DialogTitle>
                <DialogDescription>Cadastre um eletricista no clube.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="novo-nome">Nome *</Label>
                  <Input id="novo-nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="novo-telefone">Telefone</Label>
                  <Input id="novo-telefone" value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} placeholder="(15) 99999-9999" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="novo-cidade">Cidade</Label>
                  <Input id="novo-cidade" value={form.cidade} onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))} placeholder="Tatuí" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNovoOpen(false)}>Cancelar</Button>
                <Button onClick={criarParceiro} disabled={saving}>{saving ? "Salvando…" : "Cadastrar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-6">Carregando parceiros…</div>
        ) : list.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6">
            {q ? "Nenhum parceiro encontrado para a busca." : "Nenhum parceiro cadastrado ainda. Clique em “Novo parceiro” para começar."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 pr-3">Nome</th>
                  <th className="py-3 pr-3 hidden lg:table-cell">Cidade</th>
                  <th className="py-3 pr-3 hidden md:table-cell">Segmento</th>
                  <th className="py-3 pr-3 hidden md:table-cell">Telefone</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3 font-medium">{p.nome}</td>
                    <td className="py-3 pr-3 hidden lg:table-cell text-muted-foreground">
                      {p.cidade ? `${p.cidade}${p.uf ? " - " + p.uf : ""}` : "—"}
                    </td>
                    <td className="py-3 pr-3 hidden md:table-cell text-muted-foreground">{p.segmento ?? "—"}</td>
                    <td className="py-3 pr-3 hidden md:table-cell text-muted-foreground">{p.telefone ?? "—"}</td>
                    <td className="py-3 pr-3"><StatusBadge status={STATUS_LABEL[p.status] ?? p.status} /></td>
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
                          title={p.status === "bloqueado" ? "Desbloquear" : "Bloquear"}
                          onClick={() => toggleBlock(p)}
                        >
                          {p.status === "bloqueado" ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Ver detalhes */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewing?.nome}</DialogTitle>
            <DialogDescription>Detalhes do parceiro</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              {viewing.apelido && (
                <div className="flex justify-between"><span className="text-muted-foreground">Apelido</span><span>{viewing.apelido}</span></div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cidade</span>
                <span>{viewing.cidade ? `${viewing.cidade}${viewing.uf ? " - " + viewing.uf : ""}` : "—"}</span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Segmento</span><span>{viewing.segmento ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Telefone</span><span>{viewing.telefone ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">E-mail</span><span>{viewing.email ?? "—"}</span></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo de pontos</span>
                <span className="font-semibold">
                  {saldoView === undefined ? "Carregando…" : `${Number(saldoView).toLocaleString("pt-BR")} pts`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={STATUS_LABEL[viewing.status] ?? viewing.status} />
              </div>
              {viewing.observacoes && (
                <div>
                  <div className="text-muted-foreground mb-1">Observações</div>
                  <div>{viewing.observacoes}</div>
                </div>
              )}
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
              <Label htmlFor="edit-nome">Nome</Label>
              <Input id="edit-nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-telefone">Telefone</Label>
              <Input id="edit-telefone" value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-cidade">Cidade</Label>
                <Input id="edit-cidade" value={form.cidade} onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="ativo">Ativo</option>
                  <option value="bloqueado">Bloqueado</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
