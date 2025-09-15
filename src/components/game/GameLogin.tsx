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
            Preencha os três passos simples para iniciar o treinamento
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 bg-card/80 backdrop-blur-sm border-border/50 shadow-xl animate-slide-in-up">
          {(error || (password && password !== FIXED_PASSWORD)) && (
            <Alert
              id="login-alert"
              className="mb-6 border-destructive/50 bg-destructive/10 animate-shake"
            >
              <AlertDescription className="text-destructive-foreground">
                {password && password !== FIXED_PASSWORD
                  ? "Senha inválida. Dica: a senha padrão é ze2025."
                  : error}
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-6 rounded-lg border border-border/40 bg-bg-tertiary/50 p-3 text-sm text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">Como preencher?</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <span className="text-foreground">Código:</span> informe o número de identificação que a liderança lhe passou.
              </li>
              <li>
                <span className="text-foreground">Nome:</span> escreva exatamente como deseja ver no certificado.
              </li>
              <li>
                <span className="text-foreground">Senha:</span> digite <strong className="text-foreground">ze2025</strong>, a senha padrão do treinamento.
              </li>
            </ol>
            <p className="text-xs text-muted-foreground/80">
              Essas informações garantem que o seu resultado fique registrado corretamente no relatório.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id" className="text-sm font-semibold">
                1. Digite o seu código de participante
              </Label>
              <Input
                id="id"
                type="text"
                placeholder="Ex.: 12345"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="bg-bg-tertiary border-border focus:border-primary focus:ring-primary/20"
                disabled={loading}
                autoComplete="off"
                required
              />
              <p className="text-xs text-muted-foreground">
                Esse código identifica o seu resultado no relatório final.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                2. Escreva seu nome completo
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Como você quer aparecer no certificado"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-bg-tertiary border-border focus:border-primary focus:ring-primary/20"
                disabled={loading}
                autoComplete="name"
                required
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
                type="password"
                placeholder="Digite a senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-bg-tertiary border-border focus:border-primary focus:ring-primary/20 font-mono tracking-wider uppercase"
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
              <div className="flex items-center gap-3 bg-bg-tertiary/60 border border-border/40 rounded-lg p-3">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="font-semibold text-foreground">Senha única do treinamento</p>
                  <p>Digite ze2025 sem espaços extras. É só para confirmar que você está na turma correta.</p>
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