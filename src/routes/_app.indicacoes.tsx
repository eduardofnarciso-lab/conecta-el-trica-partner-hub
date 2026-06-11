import { createFileRoute, Link } from "@tanstack/react-router";
import { UserPlus, Megaphone, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/indicacoes")({
  component: IndicacoesPage,
});

function IndicacoesPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Indicações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Indique novas obras, clientes ou empresas e acumule pontos.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary via-primary/80 to-sidebar relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
        </div>
        <CardContent className="py-12 text-center">
          <div className="mx-auto h-14 w-14 -mt-20 rounded-full bg-energy text-energy-foreground flex items-center justify-center border-4 border-card">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold mt-4">Programa de indicações em breve</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Estamos preparando uma forma simples de você indicar obras e clientes
            e ganhar pontos a cada indicação convertida. Aguarde as novidades!
          </p>
          <Button asChild variant="secondary" className="mt-6">
            <Link to="/campanhas">
              <Megaphone className="h-4 w-4 mr-2" /> Enquanto isso, veja as campanhas ativas
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
