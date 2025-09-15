import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GameLoginProps {
  onLogin: (args: { id: string; name: string }) => void;
  error?: string;
  loading?: boolean;
}

const FIXED_PASSWORD = "ze2025";

export const GameLogin: React.FC<GameLoginProps> = ({
  onLogin,
  error,
  loading = false
}) => {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!id.trim() || !name.trim()) return;

    if (password !== FIXED_PASSWORD) {
      // Mostra erro local sem depender do parent
      const alertEl = document.getElementById("login-alert");
      if (alertEl) alertEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    onLogin({ id: id.trim(), name: name.trim() });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary">
      <div className="w-full max-w-md space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-foreground">
            <span className="inline-block bg-gradient-primary text-primary-foreground px-3 py-1 rounded-lg mr-2 shadow-glow">
              Zé
            </span>
            <span className="bg-gradient-to-r from-ze-yellow to-ze-yellow-light bg-clip-text text-transparent">
              Simulador Parceiro
            </span>
          </h1>
          <p className="text-muted-foreground">
            Aprenda na prática as melhores práticas do delivery
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 bg-card/80 backdrop-blur-sm border-border/50 shadow-xl animate-slide-in-up">
          {(error || password && password !== FIXED_PASSWORD) && (
            <Alert id="login-alert" className="mb-6 border-destructive/50 bg-destructive/10 animate-shake">
              <AlertDescription className="text-destructive-foreground">
                {password && password !== FIXED_PASSWORD
                  ? "Senha inválida. Dica: a senha padrão é ze2025."
                  : error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id" className="text-sm font-medium">
                ID
              </Label>
              <Input
                id="id"
                placeholder="ex.: 12345"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="bg-bg-tertiary border-border focus:border-primary focus:ring-primary/20"
                disabled={loading}
                autoComplete="off"
                required
              />
              <p className="text-xs text-muted-foreground">
                Use seu ID interno (será mapeado para email sintético).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome
              </Label>
              <Input
                id="name"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-bg-tertiary border-border focus:border-primary focus:ring-primary/20"
                disabled={loading}
                autoComplete="name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite a senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-bg-tertiary border-border focus:border-primary focus:ring-primary/20"
                disabled={loading}
                autoComplete="current-password"
                required
              />
              <p className="text-xs text-muted-foreground">
                Senha padrão: <span className="font-mono">ze2025</span>
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:shadow-glow-strong transition-all duration-200 hover:-translate-y-0.5 font-semibold"
                disabled={loading || !id.trim() || !name.trim() || !password.trim()}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                    Entrando...
                  </div>
                ) : (
                  "Entrar"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-xs text-center text-muted-foreground">
              Primeiro acesso? A conta será criada automaticamente
            </p>
          </div>
        </Card>

        {/* Game Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl">📚</div>
            <div className="text-xs text-muted-foreground">15 Lições</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">📊</div>
            <div className="text-xs text-muted-foreground">KPIs Reais</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">🏆</div>
            <div className="text-xs text-muted-foreground">Gamificação</div>
          </div>
        </div>
      </div>
    </div>
  );
};
