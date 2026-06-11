import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Zap, Trash2, Gift, PackageCheck, PackageX, Truck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/premios")({
  component: AdminRewards,
});

const RESGATE_STATUS_LABEL: Record<string, string> = {
  solicitado: "Em análise",
  em_separacao: "Em separação",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

type Premio = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  custo_pontos: number;
  disponivel: boolean;
  estoque: number | null;
  emoji: string | null;
};

type Resgate = {
  id: string;
  custo_pontos: number;
  status: string;
  created_at: string;
  premio: { nome: string; emoji: string | null } | null;
  eletricista: { nome: string } | null;
};

async function fetchPremios(): Promise<Premio[]> {
  const { data, error } = await supabase
    .from("premios")
    .select("id, nome, descricao, categoria, custo_pontos, disponivel, estoque, emoji")
    .order("custo_pontos");
  if (error) throw error;
  return (data ?? []) as Premio[];
}

async function fetchResgatesPendentes(): Promise<Resgate[]> {
  const { data, error } = await supabase
    .from("resgates")
    .select("id, custo_pontos, status, created_at, premio:premios(nome, emoji), eletricista:eletricistas(nome)")
    .in("status", ["solicitado", "em_separacao"])
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Resgate[];
}

function AdminRewards() {
  const queryClient = useQueryClient();
  const { data: premios = [], isLoading } = useQuery({ queryKey: ["admin-premios"], queryFn: fetchPremios });
  const { data: resgates = [], isLoading: loadingResgates } = useQuery({
    queryKey: ["admin-resgates-pendentes"],
    queryFn: fetchResgatesPendentes,
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", categoria: "", custo_pontos: "", emoji: "", descricao: "" });
  const [saving, setSaving] = useState(false);

  const refreshPremios = () => queryClient.invalidateQueries({ queryKey: ["admin-premios"] });
  const refreshResgates = () => queryClient.invalidateQueries({ queryKey: ["admin-resgates-pendentes"] });

  async function criarPremio() {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do prêmio.");
      return;
    }
    const custo = Number(form.custo_pontos);
    if (!custo || custo <= 0) {
      toast.error("Informe o custo em pontos (maior que zero).");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("premios").insert({
      nome: form.nome.trim(),
      categoria: form.categoria.trim() || null,
      custo_pontos: custo,
      emoji: form.emoji.trim() || null,
      descricao: form.descricao.trim() || null,
      disponivel: true,
    });
    setSaving(false);
    if (error) {
      toast.error("Não foi possível cadastrar: " + error.message);
      return;
    }
    setOpen(false);
    toast.success(`Prêmio ${form.nome.trim()} cadastrado.`);
    refreshPremios();
  }

  async function toggleDisponivel(p: Premio) {
    const { error } = await supabase.from("premios").update({ disponivel: !p.disponivel }).eq("id", p.id);
    if (error) {
      toast.error("Não foi possível atualizar: " + error.message);
      return;
    }
    toast.success(`${p.nome} agora está ${p.disponivel ? "indisponível" : "disponível"}.`);
    refreshPremios();
  }

  async function excluirPremio(p: Premio) {
    if (!window.confirm(`Excluir o prêmio “${p.nome}”? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("premios").delete().eq("id", p.id);
    if (error) {
      toast.error("Não foi possível excluir (pode haver resgates vinculados): " + error.message);
      return;
    }
    toast.success(`Prêmio ${p.nome} excluído.`);
    refreshPremios();
  }

  async function setResgateStatus(r: Resgate, status: "em_separacao" | "concluido" | "cancelado") {
    if (status === "cancelado" && !window.confirm("Cancelar este resgate?")) return;
    const { error } = await supabase.from("resgates").update({ status }).eq("id", r.id);
    if (error) {
      toast.error("Não foi possível atualizar: " + error.message);
      return;
    }
    const msg: Record<string, string> = {
      em_separacao: "Resgate em separação.",
      concluido: "Resgate concluído.",
      cancelado: "Resgate cancelado.",
    };
    status === "cancelado" ? toast.error(msg[status]) : toast.success(msg[status]);
    refreshResgates();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Prêmios</CardTitle>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setForm({ nome: "", categoria: "", custo_pontos: "", emoji: "", descricao: "" }); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Novo prêmio</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo prêmio</DialogTitle>
                <DialogDescription>Cadastre um item na loja de pontos.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="premio-nome">Nome *</Label>
                  <Input id="premio-nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="premio-categoria">Categoria</Label>
                    <Input id="premio-categoria" value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} placeholder="Ferramentas" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="premio-custo">Custo (pontos) *</Label>
                    <Input id="premio-custo" type="number" min={1} value={form.custo_pontos} onChange={(e) => setForm((f) => ({ ...f, custo_pontos: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="premio-emoji">Emoji</Label>
                  <Input id="premio-emoji" value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} placeholder="🔧" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="premio-descricao">Descrição</Label>
                  <Input id="premio-descricao" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={criarPremio} disabled={saving}>{saving ? "Salvando…" : "Cadastrar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-6">Carregando prêmios…</div>
          ) : premios.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6">
              Nenhum prêmio cadastrado ainda. Clique em “Novo prêmio” para montar a loja.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 pr-3">Nome</th>
                    <th className="py-3 pr-3 hidden md:table-cell">Categoria</th>
                    <th className="py-3 pr-3 text-right">Custo</th>
                    <th className="py-3 pr-3 text-right hidden sm:table-cell">Estoque</th>
                    <th className="py-3 pr-3">Disponível</th>
                    <th className="py-3 pr-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {premios.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-3 font-medium">
                        <span className="flex items-center gap-2">
                          <span className="text-xl">{p.emoji ?? "🎁"}</span> {p.nome}
                        </span>
                      </td>
                      <td className="py-3 pr-3 hidden md:table-cell">
                        {p.categoria ? <Badge variant="outline">{p.categoria}</Badge> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-3 pr-3 text-right font-semibold whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Zap className="h-3 w-3 text-energy" />
                          {p.custo_pontos.toLocaleString("pt-BR")}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right hidden sm:table-cell text-muted-foreground">{p.estoque ?? "—"}</td>
                      <td className="py-3 pr-3">
                        <Switch checked={p.disponivel} onCheckedChange={() => toggleDisponivel(p)} />
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex justify-end">
                          <Button size="icon" variant="ghost" title="Excluir" onClick={() => excluirPremio(p)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-4 w-4" /> Resgates pendentes ({resgates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingResgates ? (
            <div className="text-sm text-muted-foreground py-6">Carregando…</div>
          ) : resgates.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6">Nenhum resgate aguardando atendimento.</div>
          ) : (
            <div className="space-y-3">
              {resgates.map((r) => (
                <div key={r.id} className="border border-border rounded-lg p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl">{r.premio?.emoji ?? "🎁"}</span>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.premio?.nome ?? "—"}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {r.eletricista?.nome ?? "—"} · {r.custo_pontos.toLocaleString("pt-BR")} pts ·{" "}
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={RESGATE_STATUS_LABEL[r.status] ?? r.status} />
                    {r.status === "solicitado" && (
                      <Button size="sm" variant="outline" onClick={() => setResgateStatus(r, "em_separacao")}>
                        <Truck className="h-4 w-4 mr-1" /> Em separação
                      </Button>
                    )}
                    <Button size="sm" onClick={() => setResgateStatus(r, "concluido")}>
                      <PackageCheck className="h-4 w-4 mr-1" /> Concluir
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setResgateStatus(r, "cancelado")}>
                      <PackageX className="h-4 w-4 mr-1" /> Cancelar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
