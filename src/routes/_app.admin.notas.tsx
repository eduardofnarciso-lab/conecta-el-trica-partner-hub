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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/badges";
import { supabase } from "@/lib/supabase";
import { parseNfeXml, parseOrcamentoTexto, matchCategoria, type NfeParsed, type NfeItem, type CategoriaMatch } from "@/lib/nfe";
import { Plus, Search, CheckCircle2, XCircle, FileUp, Zap, ClipboardList, FileCode2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/notas")({
  component: AdminNotas,
});

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const NOTA_STATUS_LABEL: Record<string, string> = {
  em_analise: "Em análise",
  confirmada: "Confirmada",
  reprovada: "Reprovada",
};

type Nota = {
  id: string;
  numero_nota: string | null;
  valor: number;
  pontos: number;
  data_compra: string;
  status: string;
  eletricista: { nome: string } | null;
  vendedor: { nome: string } | null;
  campanha: { nome: string } | null;
};

async function fetchNotas(): Promise<Nota[]> {
  const { data, error } = await supabase
    .from("notas")
    .select("id, numero_nota, valor, pontos, data_compra, status, eletricista:eletricistas(nome), vendedor:vendedor_id(nome), campanha:campanhas(nome)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Nota[];
}

function AdminNotas() {
  const queryClient = useQueryClient();
  const { data: notas = [], isLoading } = useQuery({ queryKey: ["admin-notas"], queryFn: fetchNotas });
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const list = notas.filter((n) =>
    (n.eletricista?.nome ?? "").toLowerCase().includes(q.toLowerCase()),
  );
  const totalValue = list.reduce((s, n) => s + Number(n.valor), 0);
  const totalPoints = list.reduce((s, n) => s + (n.status === "confirmada" ? n.pontos : 0), 0);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-notas"] });

  async function setStatus(n: Nota, status: "confirmada" | "reprovada") {
    let motivo: string | null = null;
    if (status === "reprovada") {
      motivo = window.prompt("Motivo da reprovação:") || null;
      if (motivo === null) return;
    }
    const { error } = await supabase
      .from("notas")
      .update({ status, motivo_reprovacao: motivo })
      .eq("id", n.id);
    if (error) {
      toast.error("Não foi possível atualizar: " + error.message);
      return;
    }
    status === "confirmada"
      ? toast.success(`Nota confirmada — ${n.pontos.toLocaleString("pt-BR")} pts para ${n.eletricista?.nome ?? "o eletricista"}.`)
      : toast.error("Nota reprovada.");
    refresh();
    queryClient.invalidateQueries({ queryKey: ["ranking"] });
  }

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
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1" /> Lançar nota</Button>
              </DialogTrigger>
              <LancarNotaDialog onDone={() => { setOpen(false); refresh(); }} />
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-6">Carregando notas…</div>
          ) : list.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6">Nenhuma nota lançada ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 pr-3">Data</th>
                    <th className="py-3 pr-3">Eletricista</th>
                    <th className="py-3 pr-3 hidden md:table-cell">NF</th>
                    <th className="py-3 pr-3 hidden lg:table-cell">Campanha</th>
                    <th className="py-3 pr-3 hidden md:table-cell">Vendedor</th>
                    <th className="py-3 pr-3 text-right">Valor</th>
                    <th className="py-3 pr-3 text-right">Pontos</th>
                    <th className="py-3 pr-3">Status</th>
                    <th className="py-3 pr-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((n) => (
                    <tr key={n.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-3 text-muted-foreground">{n.data_compra?.split("-").reverse().join("/")}</td>
                      <td className="py-3 pr-3 font-medium">{n.eletricista?.nome ?? "—"}</td>
                      <td className="py-3 pr-3 hidden md:table-cell text-muted-foreground">{n.numero_nota ?? "—"}</td>
                      <td className="py-3 pr-3 hidden lg:table-cell text-muted-foreground">{n.campanha?.nome ?? "—"}</td>
                      <td className="py-3 pr-3 hidden md:table-cell text-muted-foreground">{n.vendedor?.nome ?? "—"}</td>
                      <td className="py-3 pr-3 text-right">{brl(Number(n.valor))}</td>
                      <td className="py-3 pr-3 text-right font-semibold">{n.pontos.toLocaleString("pt-BR")}</td>
                      <td className="py-3 pr-3"><StatusBadge status={NOTA_STATUS_LABEL[n.status] ?? n.status} /></td>
                      <td className="py-3 pr-3">
                        {n.status === "em_analise" && (
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" title="Confirmar" onClick={() => setStatus(n, "confirmada")}>
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Reprovar" onClick={() => setStatus(n, "reprovada")}>
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type Eletricista = { id: string; nome: string; vendedor_id: string | null };
type Campanha = { id: string; nome: string; destaque: boolean; data_inicio: string | null; data_fim: string | null };

type ItemPreview = {
  codigo: string;
  descricao: string;
  ncm: string;
  quantidade: number;
  valor: number;
  categoria: CategoriaMatch | null;
  pontos: number;
};

function LancarNotaDialog({ onDone }: { onDone: () => void }) {
  const [modo, setModo] = useState<"orcamento" | "xml">("orcamento");
  const [eletricistaId, setEletricistaId] = useState("");
  const [nfe, setNfe] = useState<NfeParsed | null>(null);
  const [fileName, setFileName] = useState("");
  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [itens, setItens] = useState<ItemPreview[]>([]);
  const [saving, setSaving] = useState(false);
  const [textoOrc, setTextoOrc] = useState("");
  const [numeroManual, setNumeroManual] = useState("");
  const [dataManual, setDataManual] = useState(new Date().toISOString().slice(0, 10));

  const { data: eletricistas = [] } = useQuery({
    queryKey: ["eletricistas-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eletricistas")
        .select("id, nome, vendedor_id")
        .eq("status", "ativo")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Eletricista[];
    },
  });

  async function processParsed(parsed: NfeParsed) {
    setNfe(parsed);
    try {
      const dataCompra = parsed.dataEmissao || new Date().toISOString().slice(0, 10);
      const { data: campanhas, error } = await supabase
        .from("campanhas")
        .select("id, nome, destaque, data_inicio, data_fim")
        .eq("status", "ativa")
        .or(`data_inicio.is.null,data_inicio.lte.${dataCompra}`)
        .or(`data_fim.is.null,data_fim.gte.${dataCompra}`)
        .order("destaque", { ascending: false });
      if (error) throw error;

      const camp = (campanhas ?? [])[0] as Campanha | undefined;
      if (!camp) {
        setCampanha(null);
        setItens(parsed.itens.map((i) => ({ ...i, categoria: null, pontos: 0 })));
        toast.warning("Nenhuma campanha ativa na data da compra — a nota não vai pontuar.");
        return;
      }
      setCampanha(camp);

      const { data: cats, error: catErr } = await supabase
        .from("campanha_categorias")
        .select("id, nome, palavras_chave, ncm_prefixos, pontos_por_real")
        .eq("campanha_id", camp.id)
        .eq("ativo", true);
      if (catErr) throw catErr;

      const categorias = (cats ?? []) as CategoriaMatch[];
      setItens(
        parsed.itens.map((i) => {
          const cat = matchCategoria(i, categorias);
          return {
            ...i,
            categoria: cat,
            pontos: cat ? Math.round(i.valor * Number(cat.pontos_por_real)) : 0,
          };
        }),
      );
      if (categorias.length === 0) {
        toast.warning(`A campanha “${camp.nome}” não tem categorias cadastradas — nenhum item vai pontuar.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao processar os itens.");
      setNfe(null);
      setItens([]);
    }
  }

  async function handleFile(file: File) {
    try {
      const parsed = parseNfeXml(await file.text());
      setFileName(file.name);
      await processParsed(parsed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao ler o XML.");
      setNfe(null);
      setItens([]);
    }
  }

  async function handleOrcamento() {
    const lidos: NfeItem[] = parseOrcamentoTexto(textoOrc);
    if (lidos.length === 0) {
      toast.error("Não consegui interpretar nenhum item. Cole as linhas dos itens do orçamento.");
      return;
    }
    await processParsed({
      numero: numeroManual.trim(),
      dataEmissao: dataManual,
      valorTotal: lidos.reduce((sum, i) => sum + i.valor, 0),
      emitente: "Elettro Ponto",
      destinatario: "",
      itens: lidos,
    });
    toast.success(`${lidos.length} itens interpretados.`);
  }

  const totalPontos = itens.reduce((s, i) => s + i.pontos, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eletricistaId) {
      toast.error("Selecione o eletricista.");
      return;
    }
    if (!nfe) {
      toast.error("Envie o XML da NF-e.");
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const eletricista = eletricistas.find((el) => el.id === eletricistaId);
      const { data: nota, error } = await supabase
        .from("notas")
        .insert({
          eletricista_id: eletricistaId,
          campanha_id: campanha?.id ?? null,
          vendedor_id: eletricista?.vendedor_id ?? null,
          numero_nota: nfe.numero || null,
          valor: nfe.valorTotal,
          data_compra: nfe.dataEmissao || new Date().toISOString().slice(0, 10),
          status: "em_analise",
          criado_por: auth.user?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: itensErr } = await supabase.from("nota_itens").insert(
        itens.map((i) => ({
          nota_id: nota.id,
          codigo: i.codigo || null,
          descricao: i.descricao,
          ncm: i.ncm || null,
          quantidade: i.quantidade,
          valor: i.valor,
          categoria_id: i.categoria?.id ?? null,
          elegivel: !!i.categoria,
          pontos: i.pontos,
        })),
      );
      if (itensErr) throw itensErr;

      toast.success(`Nota lançada — ${totalPontos.toLocaleString("pt-BR")} pts aguardando aprovação.`);
      setNfe(null); setItens([]); setEletricistaId(""); setFileName("");
      onDone();
    } catch (err) {
      toast.error("Não foi possível lançar a nota: " + (err instanceof Error ? err.message : ""));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Lançar nota (XML da NF-e)</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="eletricista">Eletricista *</Label>
          <select
            id="eletricista"
            value={eletricistaId}
            onChange={(e) => setEletricistaId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            required
          >
            <option value="">Selecione…</option>
            {eletricistas.map((el) => (
              <option key={el.id} value={el.id}>{el.nome}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button type="button" size="sm" variant={modo === "orcamento" ? "default" : "outline"} onClick={() => setModo("orcamento")}>
            <ClipboardList className="h-4 w-4 mr-1" /> Orçamento / cupom
          </Button>
          <Button type="button" size="sm" variant={modo === "xml" ? "default" : "outline"} onClick={() => setModo("xml")}>
            <FileCode2 className="h-4 w-4 mr-1" /> XML da NF-e
          </Button>
        </div>

        {modo === "xml" ? (
          <div className="space-y-1.5">
            <Label htmlFor="xml">XML da NF-e *</Label>
            <label className="flex items-center gap-3 rounded-md border border-dashed border-border px-4 py-6 cursor-pointer hover:bg-muted/50 transition-colors">
              <FileUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {fileName || "Clique para escolher o arquivo .xml da nota"}
              </span>
              <input
                id="xml"
                type="file"
                accept=".xml,text/xml"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="num-orc">Número (DAV/orçamento)</Label>
                <Input id="num-orc" value={numeroManual} onChange={(e) => setNumeroManual(e.target.value)} placeholder="20086069" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data-orc">Data da compra</Label>
                <Input id="data-orc" type="date" value={dataManual} onChange={(e) => setDataManual(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="texto-orc">Itens do orçamento (cole o texto)</Label>
              <textarea
                id="texto-orc"
                value={textoOrc}
                onChange={(e) => setTextoOrc(e.target.value)}
                rows={6}
                placeholder={"9681 3,000 UN LED TRILHO PT BARRA 2,0 MTS 28,050 84,15\n1276 30,000 MT CABO PP 500V 2X1,0MM 3,220 96,60"}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm font-mono"
              />
              <p className="text-xs text-muted-foreground">Uma linha por item: código, quantidade, unidade, descrição, valor unitário e total.</p>
            </div>
            <Button type="button" variant="secondary" onClick={handleOrcamento}>
              Interpretar itens e calcular pontos
            </Button>
          </div>
        )}

        {nfe && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm rounded-md border border-border p-3">
              <div><div className="text-xs text-muted-foreground">NF</div><div className="font-medium">{nfe.numero || "—"}</div></div>
              <div><div className="text-xs text-muted-foreground">Data</div><div className="font-medium">{nfe.dataEmissao?.split("-").reverse().join("/") || "—"}</div></div>
              <div><div className="text-xs text-muted-foreground">Valor</div><div className="font-medium">{brl(nfe.valorTotal)}</div></div>
              <div><div className="text-xs text-muted-foreground">Campanha</div><div className="font-medium">{campanha?.nome ?? "Nenhuma"}</div></div>
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3 hidden sm:table-cell">NCM</th>
                    <th className="py-2 px-3 text-right">Valor</th>
                    <th className="py-2 px-3">Categoria</th>
                    <th className="py-2 px-3 text-right">Pontos</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((i, idx) => (
                    <tr key={idx} className={"border-b border-border last:border-0 " + (i.categoria ? "" : "opacity-60")}>
                      <td className="py-2 px-3">{i.descricao}</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-muted-foreground">{i.ncm || "—"}</td>
                      <td className="py-2 px-3 text-right">{brl(i.valor)}</td>
                      <td className="py-2 px-3">{i.categoria?.nome ?? <span className="text-muted-foreground">Não pontua</span>}</td>
                      <td className="py-2 px-3 text-right font-semibold">{i.pontos.toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 text-sm font-semibold">
              <Zap className="h-4 w-4 text-energy" /> Total: {totalPontos.toLocaleString("pt-BR")} pts
            </div>
          </>
        )}

        <DialogFooter>
          <Button type="submit" disabled={saving || !nfe} className="w-full sm:w-auto">
            {saving ? "Lançando…" : "Lançar nota"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
