import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Receipt, ArrowDownRight, ArrowUpRight, Search, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/badges";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/extrato")({
  component: ExtratoPage,
});

type Transacao = {
  id: string;
  tipo: string;
  pontos: number;
  origem: string | null;
  descricao: string | null;
  status: string;
  created_at: string;
};

const TIPO_LABEL: Record<string, string> = {
  ganho: "Ganho",
  resgate: "Resgate",
  ajuste: "Ajuste",
  estorno: "Estorno",
};

const TRANSACAO_STATUS_LABEL: Record<string, string> = {
  confirmado: "Confirmado",
  pendente: "Pendente",
  cancelado: "Cancelado",
};

const types = ["Todos", "ganho", "resgate", "ajuste", "estorno"] as const;

function ExtratoPage() {
  const { profile } = useAuth();
  const [type, setType] = useState<string>("Todos");
  const [period, setPeriod] = useState<string>("30");
  const [q, setQ] = useState("");

  const { data: eletricista, isLoading: loadingEletricista } = useQuery({
    queryKey: ["eletricista-logado", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eletricistas")
        .select("id, nome")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; nome: string } | null;
    },
  });

  const { data: transacoes = [], isLoading: loadingTransacoes } = useQuery({
    queryKey: ["extrato-transacoes", eletricista?.id],
    enabled: !!eletricista?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes_pontos")
        .select("id, tipo, pontos, origem, descricao, status, created_at")
        .eq("eletricista_id", eletricista!.id)
        .neq("status", "cancelado")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Transacao[];
    },
  });

  const items = useMemo(() => {
    return transacoes.filter((t) => {
      if (type !== "Todos" && t.tipo !== type) return false;
      const texto = `${t.descricao ?? ""} ${t.origem ?? ""}`.toLowerCase();
      if (q && !texto.includes(q.toLowerCase())) return false;
      const days = parseInt(period);
      const diff = (Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (diff > days) return false;
      return true;
    });
  }, [transacoes, type, period, q]);

  const totals = useMemo(() => {
    const earned = items.filter((t) => t.pontos > 0).reduce((a, b) => a + b.pontos, 0);
    const spent = items.filter((t) => t.pontos < 0).reduce((a, b) => a + b.pontos, 0);
    return { earned, spent, balance: earned + spent };
  }, [items]);

  const isLoading = loadingEletricista || (!!eletricista && loadingTransacoes);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Extrato de pontos</h1>
        <p className="text-muted-foreground text-sm mt-1">Acompanhe todas as suas movimentações.</p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-6">Carregando…</div>
      ) : !eletricista ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <UserX className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium text-foreground">Seu usuário não está vinculado a um cadastro de eletricista.</p>
            <p className="text-sm mt-1">O extrato de pontos fica disponível apenas para eletricistas cadastrados.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <div className="text-xs text-muted-foreground">Pontos ganhos no período</div>
                <div className="text-2xl font-bold mt-2 text-success flex items-center gap-1">
                  <ArrowUpRight className="h-5 w-5" /> +{totals.earned.toLocaleString("pt-BR")}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-xs text-muted-foreground">Pontos resgatados</div>
                <div className="text-2xl font-bold mt-2 text-destructive flex items-center gap-1">
                  <ArrowDownRight className="h-5 w-5" /> {totals.spent.toLocaleString("pt-BR")}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary text-primary-foreground border-0">
              <CardContent className="p-5">
                <div className="text-xs text-primary-foreground/70">Saldo no período</div>
                <div className="text-2xl font-bold mt-2">{totals.balance.toLocaleString("pt-BR")}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4" /> Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar descrição..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
                </div>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t} value={t}>{t === "Todos" ? "Todos" : TIPO_LABEL[t] ?? t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                    <SelectItem value="365">Último ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  {transacoes.length === 0
                    ? "Nenhuma transação ainda."
                    : "Nenhuma movimentação encontrada para os filtros selecionados."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                      <tr>
                        <th className="py-3 pr-3">Data</th>
                        <th className="py-3 pr-3">Descrição</th>
                        <th className="py-3 pr-3 hidden sm:table-cell">Tipo</th>
                        <th className="py-3 pr-3 hidden md:table-cell">Status</th>
                        <th className="py-3 pr-3 text-right">Pontos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((t) => (
                        <tr key={t.id} className="border-b border-border last:border-0">
                          <td className="py-3 pr-3 text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</td>
                          <td className="py-3 pr-3 font-medium">{t.descricao ?? t.origem ?? TIPO_LABEL[t.tipo] ?? t.tipo}</td>
                          <td className="py-3 pr-3 hidden sm:table-cell text-muted-foreground">{TIPO_LABEL[t.tipo] ?? t.tipo}</td>
                          <td className="py-3 pr-3 hidden md:table-cell"><StatusBadge status={TRANSACAO_STATUS_LABEL[t.status] ?? t.status} /></td>
                          <td className={`py-3 pr-3 text-right font-semibold ${t.pontos >= 0 ? "text-success" : "text-destructive"}`}>
                            {t.pontos > 0 ? "+" : ""}{t.pontos.toLocaleString("pt-BR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
