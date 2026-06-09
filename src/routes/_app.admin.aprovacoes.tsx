import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, CheckSquare } from "lucide-react";
import { adminApprovals } from "@/lib/mocks";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/aprovacoes")({
  component: AdminApprovals,
});

function AdminApprovals() {
  const [items, setItems] = useState(adminApprovals);
  const decide = (id: string, ok: boolean) => {
    setItems((p) => p.filter((i) => i.id !== id));
    toast[ok ? "success" : "error"](ok ? "Pontos aprovados" : "Solicitação reprovada");
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Aprovação de pontos ({items.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
            Nenhuma solicitação pendente.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <div key={a.id} className="border border-border rounded-lg p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-medium">{a.partner}</div>
                  <div className="text-sm text-muted-foreground">{a.origin} · {a.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(a.date).toLocaleDateString("pt-BR")}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Pontos</div>
                    <div className="font-bold text-lg">{a.points.toLocaleString("pt-BR")}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => decide(a.id, false)}>
                    <X className="h-4 w-4 mr-1" /> Reprovar
                  </Button>
                  <Button size="sm" onClick={() => decide(a.id, true)}>
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
