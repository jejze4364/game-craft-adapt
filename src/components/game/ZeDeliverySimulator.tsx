import React, { useState } from "react";
import { GameLogin } from "./GameLogin";
import { GameMap } from "./GameMap";
import { GameHUD } from "./GameHUD";
import { CheckpointModal } from "./CheckpointModal";
import { SettingsModal } from "./SettingsModal";
import { CertificateModal } from "./CertificateModal";
import { useGameState } from "@/hooks/useGameState";
import { useDatabase } from "@/hooks/useDatabase";
import type { Player } from "@/hooks/useDatabase";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

export const ZeDeliverySimulator: React.FC = () => {
  const { gameState, actions } = useGameState();
  const { savePlayer, saveGameSession, saveCheckpointProgress } = useDatabase();
  const [currentCheckpoint, setCurrentCheckpoint] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [checkpointStartTime, setCheckpointStartTime] = useState<number>(Date.now());

  const handleLogin = async (playerCode: string, playerName: string) => {
    setLoginLoading(true);
    setLoginError("");

    try {
      // Quick loading feedback for the user
      await new Promise(resolve => setTimeout(resolve, 600));

      const player = await savePlayer(playerCode, playerName);
      if (!player) {
        throw new Error("Não foi possível salvar seus dados. Tente novamente.");
      }

      setCurrentPlayer(player);
      setCurrentSessionId(null);
      actions.resetGame();
      actions.startGame(playerName);
      toast.success(`Bem-vindo(a), ${playerName}!`);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Erro no login");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleCheckpointReach = (checkpointId: number) => {
    const checkpoint = gameState.checkpoints.find(cp => cp.id === checkpointId);
    if (checkpoint && checkpoint.status !== "completed") {
      setCurrentCheckpoint(checkpointId);
      setCheckpointStartTime(Date.now());

      const message = checkpoint.status === "failed"
        ? "Revise o conteúdo com calma e tente responder novamente."
        : "Checkpoint encontrado! Assista ao vídeo e responda à questão educativa.";

      toast.info(message);
    }
  };

  const handleAnswer = async (checkpointId: number, isCorrect: boolean) => {
    const timeTaken = Math.floor((Date.now() - checkpointStartTime) / 1000);

    actions.answerCheckpoint(checkpointId, isCorrect);

    if (isCorrect) {
      setCurrentCheckpoint(null);
    }
    
    // Save checkpoint progress to database
    if (currentSessionId) {
      await saveCheckpointProgress(currentSessionId, checkpointId, isCorrect, timeTaken);
    }
    
    if (isCorrect) {
      toast.success("Resposta correta! +100 pontos e KPIs melhorados!");
    } else {
      toast.error("Resposta incorreta. Você pode revisar e tentar de novo.");
    }

    // Check game over
    if (gameState.stats.lives <= 1 && !isCorrect) {
      setTimeout(async () => {
        toast.error("Game Over! Suas vidas acabaram.");
        await saveGameData(false);
        actions.resetGame();
        setCurrentSessionId(null);
      }, 2000);
    }

    // Check victory - need to check the updated state
    const updatedCompletedCount = gameState.checkpoints.filter(cp =>
      cp.status === "completed" || (cp.id === checkpointId && isCorrect)
    ).length;
    
    if (updatedCompletedCount === gameState.checkpoints.length && isCorrect) {
      setTimeout(async () => {
        toast.success("🎉 Parabéns! Você completou todos os 15 checkpoints do simulador!");
        await saveGameData(true);
        setShowCertificate(true);
      }, 2000);
    }
  };

  const saveGameData = async (isCompleted: boolean) => {
    if (!currentPlayer) return;

    // Convert sessionTime from string format "Xm Ys" to seconds
    const timeInSeconds = (() => {
      const timeStr = gameState.stats.sessionTime;
      const minutes = parseInt(timeStr.match(/(\d+)m/)?.[1] || '0', 10);
      const seconds = parseInt(timeStr.match(/(\d+)s/)?.[1] || '0', 10);
      return minutes * 60 + seconds;
    })();

    const gameData = {
      score: gameState.stats.score,
      lives_used: 5 - gameState.stats.lives,
      total_time: timeInSeconds,
      completed_checkpoints: gameState.checkpoints.filter(cp => cp.status === "completed").length,
      accuracy_percentage: gameState.kpis.disponibilidade,
      delivery_efficiency: gameState.kpis.aceitacao,
      customer_satisfaction: gameState.kpis.avaliacao,
      is_completed: isCompleted
    };

    const session = await saveGameSession(currentPlayer, gameData);
    if (session && !currentSessionId) {
      setCurrentSessionId(session.id);
    }
  };

  // Login screen
  if (!gameState.currentUser) {
    return (
      <GameLogin
        onLogin={handleLogin}
        error={loginError}
        loading={loginLoading}
      />
    );
  }

  const currentCheckpointData = currentCheckpoint !== null 
    ? gameState.checkpoints.find(cp => cp.id === currentCheckpoint)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary">
      <div className="container mx-auto p-4 max-w-7xl space-y-6">
        {/* Game HUD */}
        <GameHUD
          playerName={currentPlayer?.name || gameState.currentUser || "Jogador"}
          playerCode={currentPlayer?.code}
          stats={gameState.stats}
          kpis={gameState.kpis}
          onSettingsClick={() => setShowSettings(true)}
        />

        <Card className="p-6 bg-card/60 border-border/50 backdrop-blur-sm">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Objetivo do simulador</h2>
              <p className="text-muted-foreground leading-relaxed">
                Aqui você pratica, passo a passo, o atendimento ideal do parceiro Zé Delivery. Em cada ponto do mapa, basta seguir os três passos abaixo.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-bg-tertiary/40">
                <span className="text-2xl" role="img" aria-label="Abrir aula">📍</span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">1. Abra a aula</p>
                  <p className="text-sm text-muted-foreground">Clique ou toque no ponto do mapa para assistir ao conteúdo daquele tema.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-bg-tertiary/40">
                <span className="text-2xl" role="img" aria-label="Assistir video">▶️</span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">2. Veja o vídeo até o final</p>
                  <p className="text-sm text-muted-foreground">O botão da pergunta aparece sozinho quando a barra de progresso chega ao fim.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-bg-tertiary/40">
                <span className="text-2xl" role="img" aria-label="Responder pergunta">✅</span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">3. Responda com calma</p>
                  <p className="text-sm text-muted-foreground">Use o que acabou de aprender. Se errar, o ponto fica vermelho e você pode tentar de novo.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-3 rounded-lg bg-bg-tertiary/60 border border-border/30 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">Resultados em tempo real</p>
                <p>Os cartões acima mostram suas vidas, pontos e indicadores. Cada acerto melhora sua pontuação; cada erro gasta uma vida.</p>
              </div>
              <div className="p-3 rounded-lg bg-bg-tertiary/60 border border-border/30 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">Certificado ao final</p>
                <p>Complete todos os 15 checkpoints verdes para receber o certificado com seu nome e código.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Game Map */}
        <div className="flex justify-center">
          <GameMap
            playerPosition={gameState.playerPosition}
            onPositionChange={actions.movePlayer}
            checkpoints={gameState.checkpoints}
            onCheckpointReach={handleCheckpointReach}
          />
        </div>

        {/* Game Over Overlay */}
        {gameState.stats.lives <= 0 && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card p-8 rounded-xl border-border/50 text-center space-y-4 animate-slide-in-up">
              <h2 className="text-3xl font-bold text-ze-red">Game Over!</h2>
              <p className="text-muted-foreground">Suas vidas acabaram. Tente novamente!</p>
              <div className="flex gap-3">
                <button
                  onClick={actions.resetGame}
                  className="px-6 py-2 bg-gradient-primary text-primary-foreground rounded-lg font-semibold hover:shadow-glow-strong transition-all duration-200"
                >
                  Jogar Novamente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CheckpointModal
        isOpen={currentCheckpoint !== null}
        onClose={() => setCurrentCheckpoint(null)}
        checkpoint={currentCheckpointData || null}
        onAnswer={handleAnswer}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={gameState.settings}
        onSettingsChange={actions.updateSettings}
      />

      <CertificateModal
        isOpen={showCertificate}
        onClose={() => {
          setShowCertificate(false);
          actions.resetGame();
          setCurrentSessionId(null);
        }}
        playerData={{
          name: currentPlayer?.name || gameState.currentUser || "Jogador",
          code: currentPlayer?.code || "Sem código",
          score: gameState.stats.score,
          totalTime: (() => {
            const timeStr = gameState.stats.sessionTime;
            const minutes = parseInt(timeStr.match(/(\d+)m/)?.[1] || '0', 10);
            const seconds = parseInt(timeStr.match(/(\d+)s/)?.[1] || '0', 10);
            return minutes * 60 + seconds;
          })(),
          accuracy: gameState.kpis.disponibilidade,
          deliveryEfficiency: gameState.kpis.aceitacao,
          customerSatisfaction: gameState.kpis.avaliacao
        }}
      />
    </div>
  );
};
