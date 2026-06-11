import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/badges";
import { supabase } from "@/lib/supabase";
import { Plus, Star, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/campanhas")({
  component: AdminCampaigns,
});

type Campanha = {
  id: string;
  nome: string;
  descricao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  status: string;
  destaque: boolean;
  premiacao_top: number;
  pontos_por_real: number | null;
};

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  agendada: "Em breve",
  ativa: "Ativa",
  encerrada: "Encerrada",
};

function fmtDate(d: string | null) {
  if (!d) return null;
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
function periodo(c: Campanha) {
  const a = fmtDate(c.data_inicio);
  const b = fmtDate(c.data_fim);
  if (a && b) return `${a} — ${b}`;
  if (a) return `A partir de ${a}`;
  return "Permanente";
}

async function fetchCampanhas(): Promise<Campanha[]> {
  const { data, error } = await supabase
    .from("campanhas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Campanha[];
}

function AdminCampaigns() {
  const queryClient = useQueryClient();
  const { data: campanhas = [], isLoading } = useQuery({
    queryKey: ["admin-campanhas"],
    queryFn: fetchCampanhas,
  });
  const [open, setOpen] = useState(false);
  const [catCampanha, setCatCampanha] = useState<Campanha | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Campanhas</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" /> Nova campanha
            </Button>
          </DialogTrigger>
          <NovaCampanhaDialog
            onCreated={() => {
              setOpen(false);
              queryClient.invalidateQueries({ queryKey: ["admin-campanhas"] });
              queryClient.invalidateQueries({ queryKey: ["ranking"] });
            }}
          />
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-6">Carregando campanhas…</div>
        ) : campanhas.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6">
            Nenhuma campanha ainda. Clique em “Nova campanha” para criar a primeira.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 pr-3">Nome</th>
                  <th className="py-3 pr-3 hidden md:table-cell">Período</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3 text-right">Premiação</th>
                  <th className="py-3 pr-3 text-center">Destaque</th>
                  <th className="py-3 pr-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {campanhas.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3 font-medium">{c.nome}</td>
                    <td className="py-3 pr-3 hidden md:table-cell text-muted-foreground">{periodo(c)}</td>
                    <td className="py-3 pr-3"><StatusBadge status={STATUS_LABEL[c.status] ?? c.status} /></td>
                    <td className="py-3 pr-3 text-right">Top {c.premiacao_top}</td>
                    <td className="py-3 pr-3 text-center">
                      {c.destaque && <Star className="h-4 w-4 text-energy inline" aria-label="Em destaque" />}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setCatCampanha(c)}>
                        <Tags className="h-4 w-4 mr-1" /> Categorias
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!catCampanha} onOpenChange={(o) => !o && setCatCampanha(null)}>
        {catCampanha && <CategoriasDialog campanha={catCampanha} />}
      </Dialog>
    </Card>
  );
}

type Categoria = {
  id: string;
  campanha_id: string;
  nome: string;
  palavras_chave: string[];
  ncm_prefixos: string[];
  pontos_por_real: number;
  ativo: boolean;
};

function CategoriasDialog({ campanha }: { campanha: Campanha }) {
  const queryClient = useQueryClient();
  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ["campanha-categorias", campanha.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanha_categorias")
        .select("*")
        .eq("campanha_id", campanha.id)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Categoria[];
    },
  });

  const [nome, setNome] = useState("");
  const [palavras, setPalavras] = useState("");
  const [ncm, setNcm] = useState("");
  const [ppr, setPpr] = useState("1");
  const [saving, setSaving] = useState(false);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["campanha-categorias", campanha.id] });

  async function addCategoria(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Dê um nome à categoria.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("campanha_categorias").insert({
      campanha_id: campanha.id,
      nome: nome.trim(),
      palavras_chave: palavras.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
      ncm_prefixos: ncm.split(",").map((x) => x.trim().replace(/\D/g, "")).filter(Boolean),
      pontos_por_real: Number(ppr) || 1,
    });
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar: " + error.message);
      return;
    }
    setNome(""); setPalavras(""); setNcm(""); setPpr("1");
    toast.success("Categoria adicionada.");
    refresh();
  }

  async function removeCategoria(cat: Categoria) {
    const { error } = await supabase.from("campanha_categorias").delete().eq("id", cat.id);
    if (error) {
      toast.error("Não foi possível remover: " + error.message);
      return;
    }
    toast.success(`Categoria ${cat.nome} removida.`);
    refresh();
  }

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Categorias que pontuam — {campanha.nome}</DialogTitle>
      </DialogHeader>

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : categorias.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma categoria ainda. Itens da nota só pontuam se baterem com uma categoria cadastrada aqui.
          </p>
        ) : (
          categorias.map((cat) => (
            <div key={cat.id} className="flex items-start justify-between gap-2 rounded-md border border-border p-3">
              <div className="text-sm">
                <div className="font-medium">{cat.nome} <span className="text-muted-foreground font-normal">· {Number(cat.pontos_por_real).toLocaleString("pt-BR")} pt/R$</span></div>
                {cat.palavras_chave.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-0.5">Palavras: {cat.palavras_chave.join(", ")}</div>
                )}
                {cat.ncm_prefixos.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-0.5">NCM: {cat.ncm_prefixos.join(", ")}</div>
                )}
              </div>
              <Button size="icon" variant="ghost" title="Remover" onClick={() => removeCategoria(cat)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={addCategoria} className="space-y-3 border-t border-border pt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cat-nome">Categoria *</Label>
            <Input id="cat-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Cabos" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-ppr">Pontos por R$ 1,00</Label>
            <Input id="cat-ppr" type="number" step="0.01" min={0} value={ppr} onChange={(e) => setPpr(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-palavras">Palavras-chave (separe por vírgula)</Label>
          <Input id="cat-palavras" value={palavras} onChange={(e) => setPalavras(e.target.value)} placeholder="cabo, fio, cordoalha" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-ncm">Prefixos NCM (separe por vírgula, opcional)</Label>
          <Input id="cat-ncm" value={ncm} onChange={(e) => setNcm(e.target.value)} placeholder="8544, 7413" />
          <p className="text-xs text-muted-foreground">O item pontua se o NCM do XML começar com um prefixo ou a descrição contiver uma palavra-chave.</p>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Adicionar categoria"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function NovaCampanhaDialog({ onCreated }: { onCreated: () => void }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [status, setStatus] = useState("rascunho");
  const [premiacaoTop, setPremiacaoTop] = useState("10");
  const [pontosPorReal, setPontosPorReal] = useState("");
  const [destaque, setDestaque] = useState(false);
  const [regras, setRegras] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Dê um nome à campanha.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("campanhas").insert({
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      data_inicio: dataInicio || null,
      data_fim: dataFim || null,
      status,
      destaque,
      premiacao_top: Number(premiacaoTop) || 10,
      pontos_por_real: pontosPorReal ? Number(pontosPorReal) : null,
      regras: regras
        ? regras.split("\n").map((r) => r.trim()).filter(Boolean)
        : null,
    });
    setSaving(false);
    if (error) {
      toast.error("Não foi possível criar a campanha: " + error.message);
      return;
    }
    toast.success("Campanha criada!");
    onCreated();
  }

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Nova campanha</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Centro Sul Paulista 2026" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Sobre o que é a campanha…" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ini">Início</Label>
            <Input id="ini" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fim">Fim</Label>
            <Input id="fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="rascunho">Rascunho</option>
              <option value="agendada">Em breve</option>
              <option value="ativa">Ativa</option>
              <option value="encerrada">Encerrada</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="top">Premiar top</Label>
            <Input id="top" type="number" min={1} value={premiacaoTop} onChange={(e) => setPremiacaoTop(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ppr">Pontos por R$ (opcional)</Label>
          <Input id="ppr" type="number" step="0.01" min={0} value={pontosPorReal} onChange={(e) => setPontosPorReal(e.target.value)} placeholder="Deixe vazio para lançar os pontos manualmente" />
          <p className="text-xs text-muted-foreground">Se preenchido, dá pra calcular os pontos automaticamente a partir do valor da nota.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="regras">Regras (uma por linha)</Label>
          <Textarea id="regras" value={regras} onChange={(e) => setRegras(e.target.value)} placeholder={"Pontue a cada compra registrada.\nNotas sujeitas à aprovação."} />
        </div>

        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <Label htmlFor="destaque" className="cursor-pointer">Campanha em destaque</Label>
          <Switch id="destaque" checked={destaque} onCheckedChange={setDestaque} />
        </div>

        <DialogFooter>
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Salvando…" : "Criar campanha"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
