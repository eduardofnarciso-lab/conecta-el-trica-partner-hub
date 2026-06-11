import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TierBadge } from "@/components/badges";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/niveis")({
  component: AdminNiveis,
});

type Nivel = {
  id: number;
  nome: string;
  pontos_min: number;
  ordem: number;
  cor: string | null;
};

function AdminNiveis() {
  const queryClient = useQueryClient();
  const { data: niveis = [], isLoading } = useQuery({
    queryKey: ["admin-niveis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("niveis")
        .select("*")
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as Nivel[];
    },
  });

  const [edits, setEdits] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  function setEdit(id: number, value: string) {
    setEdits((e) => ({ ...e, [id]: value }));
  }

  async function salvar() {
    const mudancas = niveis
      .filter((n) => edits[n.id] !== undefined && Number(edits[n.id]) !== n.pontos_min)
      .map((n) => ({ id: n.id, pontos_min: Math.max(0, Number(edits[n.id]) || 0) }));

    if (mudancas.length === 0) {
      toast.info("Nenhuma alteração para salvar.");
      return;
    }

    const valores = niveis.map((n) => {
      const m = mudancas.find((x) => x.id === n.id);
      return { ordem: n.ordem, valor: m ? m.pontos_min : n.pontos_min };
    }).sort((a, b) => a.ordem - b.ordem);
    for (let i = 1; i < valores.length; i++) {
      if (valores[i].valor <= valores[i - 1].valor) {
        toast.error("Cada nível precisa exigir mais pontos que o anterior.");
        return;
      }
    }

    setSaving(true);
    for (const m of mudancas) {
      const { error } = await supabase.from("niveis").update({ pontos_min: m.pontos_min }).eq("id", m.id);
      if (error) {
        toast.error("Não foi possível salvar: " + error.message);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setEdits({});
    toast.success("Níveis atualizados.");
    queryClient.invalidateQueries({ queryKey: ["admin-niveis"] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Níveis dos eletricistas</CardTitle>
        <p className="text-sm text-muted-foreground">
          O nível é calculado pelo saldo de pontos do eletricista. Defina a partir de quantos pontos cada categoria começa.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-6">Carregando…</div>
        ) : (
          <div className="space-y-3 max-w-md">
            {niveis.map((n) => (
              <div key={n.id} className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
                <div className="flex items-center gap-3">
                  <TierBadge tier={n.nome} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">a partir de</span>
                  <Input
                    type="number"
                    min={0}
                    className="w-28 text-right"
                    value={edits[n.id] ?? String(n.pontos_min)}
                    onChange={(e) => setEdit(n.id, e.target.value)}
                    disabled={n.ordem === 1}
                  />
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <Button onClick={salvar} disabled={saving}>
                {saving ? "Salvando…" : "Salvar alterações"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O primeiro nível sempre começa em 0. A mudança vale na hora para todos os eletricistas.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
