import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, CheckSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/aprovacoes")({
  component: AdminApprovals,
});

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type NotaPendente = {
  id: string;
  numero_nota: string | null;
  valor: number;
  pontos: number;
  data_compra: string;
  eletricista: { nome: string } | null;
  campanha: { nome: string } | null;
};

async function fetchPendentes(): Promise<NotaPendente[]> {
  const { data, error } = await supabase
    .from("notas")
    .select("id, numero_nota, valor, pontos, data_compra, eletricista:eletricistas(nome), campanha:campanhas(nome)")
    .eq("status", "em_analise")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as NotaPendente[];
}

function AdminApprovals() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-aprovacoes"],
    queryFn: fetchPendentes,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-aprovacoes"] });
    queryClient.invalidateQueries({ queryKey: ["admin-notas"] });
  };

  async function decide(n: NotaPendente, aprovar: boolean) {
    let motivo: string | null = null;
    if (!aprovar) {
      motivo = window.prompt("Motivo da reprovação:") || null;
      if (motivo === null) return;
    }
    const { error } = await supabase
      .from("notas")
      .update(aprovar ? { status: "confirmada" } : { status: "reprovada", motivo_reprovacao: motivo })
      .eq("id", n.id);
    if (error) {
      toast.error("Não foi possível atualizar: " + error.message);
      return;
    }
    aprovar
      ? toast.success(`Nota aprovada — ${n.pontos.toLocaleString("pt-BR")} pts lançados para ${n.eletricista?.nome ?? "o eletricista"}.`)
      : toast.error("Nota reprovada.");
    refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CheckSquare className="h-4 w-4" /> Aprovação de notas ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-6">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
            Nenhuma nota aguardando aprovação. Tudo em dia!
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((n) => (
              <div key={n.id} className="border border-border rounded-lg p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-medium">{n.eletricista?.nome ?? "—"}</div>
                  <div className="text-sm text-muted-foreground">
                    {n.numero_nota ? `NF ${n.numero_nota}` : "Sem número"} · {brl(Number(n.valor))}
                    {n.campanha?.nome ? ` · ${n.campanha.nome}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Compra em {n.data_compra?.split("-").reverse().join("/")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Pontos</div>
                    <div className="font-bold text-lg">{n.pontos.toLocaleString("pt-BR")}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => decide(n, false)}>
                    <X className="h-4 w-4 mr-1" /> Reprovar
                  </Button>
                  <Button size="sm" onClick={() => decide(n, true)}>
                    <Check className="h-4 w-4 mr-1" /> Aprovar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
