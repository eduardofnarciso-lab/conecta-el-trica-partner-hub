import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/badges";
import { supabase } from "@/lib/supabase";
import { DollarSign, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/comissoes")({
  component: AdminComissoes,
});

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const COMISSAO_STATUS_LABEL: Record<string, string> = {
  em_aberto: "Em aberto",
  paga: "Paga",
};

type Comissao = {
  id: string;
  competencia: string | null;
  periodo_label: string | null;
  qtd_vendas: number;
  valor_vendas: number;
  taxa: number;
  valor_comissao: number;
  status: string;
  pago_em: string | null;
  vendedor: { nome: string } | null;
};

async function fetchComissoes(): Promise<Comissao[]> {
  const { data, error } = await supabase
    .from("comissoes")
    .select("id, competencia, periodo_label, qtd_vendas, valor_vendas, taxa, valor_comissao, status, pago_em, vendedor:vendedor_id(nome)")
    .order("competencia", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Comissao[];
}

function AdminComissoes() {
  const queryClient = useQueryClient();
  const { data: comissoes = [], isLoading } = useQuery({
    queryKey: ["admin-comissoes"],
    queryFn: fetchComissoes,
  });

  const emAberto = comissoes.filter((c) => c.status === "em_aberto");
  const totalAberto = emAberto.reduce((s, c) => s + Number(c.valor_comissao), 0);
  const totalVendas = comissoes.reduce((s, c) => s + Number(c.valor_vendas), 0);
  const vendedores = new Set(comissoes.map((c) => c.vendedor?.nome).filter(Boolean)).size;

  async function marcarPaga(c: Comissao) {
    const { error } = await supabase
      .from("comissoes")
      .update({ status: "paga", pago_em: new Date().toISOString() })
      .eq("id", c.id);
    if (error) {
      toast.error("Não foi possível atualizar: " + error.message);
      return;
    }
    toast.success(`Comissão de ${c.vendedor?.nome ?? "vendedor"} marcada como paga.`);
    queryClient.invalidateQueries({ queryKey: ["admin-comissoes"] });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card><CardContent className="p-5">
          <div className="text-xs text-muted-foreground">Comissões em aberto</div>
          <div className="text-2xl font-bold mt-2 text-primary">{isLoading ? "—" : brl(totalAberto)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-xs text-muted-foreground">Vendas (período)</div>
          <div className="text-2xl font-bold mt-2">{isLoading ? "—" : brl(totalVendas)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-xs text-muted-foreground">Vendedores</div>
          <div className="text-2xl font-bold mt-2">{isLoading ? "—" : vendedores}</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Comissões da equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-6">Carregando comissões…</div>
          ) : comissoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-40" />
              Nenhuma comissão registrada ainda.
              <br />
              As comissões serão geradas a partir das notas confirmadas dos vendedores.
            </div>
          ) : (
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
                    <th className="py-3 pr-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {comissoes.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-3 font-medium">{c.vendedor?.nome ?? "—"}</td>
                      <td className="py-3 pr-3 hidden md:table-cell text-muted-foreground">
                        {c.periodo_label ?? c.competencia?.split("-").reverse().join("/") ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-right">{c.qtd_vendas}</td>
                      <td className="py-3 pr-3 text-right hidden sm:table-cell whitespace-nowrap">{brl(Number(c.valor_vendas))}</td>
                      <td className="py-3 pr-3 text-right hidden lg:table-cell text-muted-foreground">
                        {(Number(c.taxa) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                      </td>
                      <td className="py-3 pr-3 text-right font-semibold whitespace-nowrap">{brl(Number(c.valor_comissao))}</td>
                      <td className="py-3 pr-3"><StatusBadge status={COMISSAO_STATUS_LABEL[c.status] ?? c.status} /></td>
                      <td className="py-3 pr-3">
                        {c.status === "em_aberto" && (
                          <div className="flex justify-end">
                            <Button size="sm" variant="outline" onClick={() => marcarPaga(c)}>
                              <Check className="h-4 w-4 mr-1" /> Marcar como paga
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
