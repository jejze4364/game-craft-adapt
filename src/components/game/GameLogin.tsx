import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface GameLoginProps {
  onLogin: (playerCode: string, playerName: string) => void;
  error?: string;
  loading?: boolean;
}

export const GameLogin: React.FC<GameLoginProps> = ({
  onLogin,
  error,
  loading = false
}) => {
  const [playerCode, setPlayerCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!playerCode.trim() || !playerName.trim()) {
      setLocalError("Informe seu código e seu nome completo.");
      return;
    }

    if (password.trim().toLowerCase() !== "ze2025".toLowerCase()) {
      setLocalError("A senha padrão é Ze2025 (sem espaços).");
      return;
    }

    onLogin(playerCode.trim(), playerName.trim());
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
            Preencha os três passos simples para iniciar o treinamento
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 bg-card/80 backdrop-blur-sm border-border/50 shadow-xl animate-slide-in-up">
          {(error || localError) && (
            <Alert className="mb-6 border-destructive/50 bg-destructive/10 animate-shake">
              <AlertDescription className="text-destructive-foreground">
                {localError || error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerCode" className="text-sm font-semibold">
                1. Digite o seu código de participante
              </Label>
              <Input
                id="playerCode"
                type="text"
                placeholder="Ex.: 12345"
                value={playerCode}
                onChange={(e) => setPlayerCode(e.target.value)}
                className="bg-bg-tertiary border-border focus:border-primary focus:ring-primary/20"
                disabled={loading}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Esse código identifica o seu resultado no relatório final.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="playerName" className="text-sm font-semibold">
                2. Escreva seu nome completo
              </Label>
              <Input
                id="playerName"
                type="text"
                placeholder="Como você quer aparecer no certificado"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-bg-tertiary border-border focus:border-primary focus:ring-primary/20"
                disabled={loading}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Use letras maiúsculas e minúsculas se preferir, será exibido exatamente assim.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                3. Confirme a senha padrão do treinamento
              </Label>
              <Input
                id="password"
                type="text"
                placeholder="Ze2025"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-bg-tertiary border-border focus:border-primary focus:ring-primary/20"
                disabled={loading}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Digite exatamente <Badge variant="secondary" className="px-2">Ze2025</Badge>. Essa senha é igual para todos.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:shadow-glow-strong transition-all duration-200 hover:-translate-y-0.5 font-semibold"
                disabled={
                  loading ||
                  !playerCode.trim() ||
                  !playerName.trim() ||
                  password.trim().length === 0
                }
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                    Entrando...
                  </div>
                ) : (
                  "Começar o treinamento"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 bg-bg-tertiary/60 border border-border/40 rounded-lg p-3">
                <span className="text-xl">🖱️</span>
                <div>
                  <p className="font-semibold text-foreground">Use o mouse ou o dedo</p>
                  <p>Depois do login, clique nos pontos do mapa para abrir as aulas.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-bg-tertiary/60 border border-border/40 rounded-lg p-3">
                <span className="text-xl">🎧</span>
                <div>
                  <p className="font-semibold text-foreground">Assista até o fim</p>
                  <p>O vídeo precisa terminar para liberar a pergunta.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Game Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl">1️⃣</div>
            <div className="text-xs text-muted-foreground">Clique em um ponto</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">2️⃣</div>
            <div className="text-xs text-muted-foreground">Assista ao vídeo</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">3️⃣</div>
            <div className="text-xs text-muted-foreground">Responda com calma</div>
          </div>
        </div>
      </div>
    </div>
  );
};
