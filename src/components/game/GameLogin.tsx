import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GameLoginProps {
  onLogin: (email: string, password: string) => void;
  onGuestLogin: () => void;
  error?: string;
  loading?: boolean;
}

export const GameLogin: React.FC<GameLoginProps> = ({
  onLogin,
  onGuestLogin,
  error,
  loading = false
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      onLogin(email.trim(), password);
    }
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
          {error && (
            <Alert className="mb-6 border-destructive/50 bg-destructive/10 animate-shake">
              <AlertDescription className="text-destructive-foreground">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-bg-tertiary border-border focus:border-primary focus:ring-primary/20"
                disabled={loading}
                autoComplete="email"
              />
              <p className="text-xs text-muted-foreground">
                Use seu email para salvar o progresso
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-bg-tertiary border-border focus:border-primary focus:ring-primary/20"
                disabled={loading}
                autoComplete="current-password"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:shadow-glow-strong transition-all duration-200 hover:-translate-y-0.5 font-semibold"
                disabled={loading || !email.trim() || !password.trim()}
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

              <Button
                type="button"
                variant="secondary"
                className="w-full bg-bg-tertiary hover:bg-bg-elevated border-border hover:border-border/80 transition-all duration-200"
                onClick={onGuestLogin}
                disabled={loading}
              >
                <span className="mr-2">👤</span>
                Jogar como Convidado
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