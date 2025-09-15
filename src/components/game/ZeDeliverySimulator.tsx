import React, { useState } from "react";
import { GameLogin } from "./GameLogin";
import { GameMap } from "./GameMap";
import { GameHUD } from "./GameHUD";
import { CheckpointModal } from "./CheckpointModal";
import { SettingsModal } from "./SettingsModal";
import { CertificateModal } from "./CertificateModal";
import { useGameState } from "@/hooks/useGameState";
import { useDatabase } from "@/hooks/useDatabase";
import { toast } from "sonner";

export const ZeDeliverySimulator: React.FC = () => {
  const { gameState, actions } = useGameState();
  const { savePlayer, saveGameSession, saveCheckpointProgress } = useDatabase();
  const [currentCheckpoint, setCurrentCheckpoint] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [checkpointStartTime, setCheckpointStartTime] = useState<number>(Date.now());

  const handleLogin = async (email: string, password: string) => {
    setLoginLoading(true);
    setLoginError("");

    try {
      // Simulate login process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (password.length < 6) {
        throw new Error("Senha deve ter pelo menos 6 caracteres");
      }

      // Save player to database
      const player = await savePlayer(email, email.split('@')[0]);
      if (player) {
        setCurrentPlayer(player);
        actions.startGame(email);
        toast.success(`Bem-vindo, ${email.split('@')[0]}!`);
      } else {
        throw new Error("Erro ao salvar dados do jogador");
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Erro no login");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    // Save guest player to database
    const guestEmail = `convidado_${Date.now()}@guest.com`;
    const player = await savePlayer(guestEmail, "Convidado");
    if (player) {
      setCurrentPlayer(player);
      actions.startGame("Convidado");
      toast.success("Bem-vindo, Convidado!");
    }
  };

  const handleCheckpointReach = (checkpointId: number) => {
    const checkpoint = gameState.checkpoints.find(cp => cp.id === checkpointId);
    if (checkpoint && !checkpoint.completed) {
      setCurrentCheckpoint(checkpointId);
      setCheckpointStartTime(Date.now());
      toast.info("Checkpoint encontrado! Responda a questão educativa.");
    }
  };

  const handleAnswer = async (checkpointId: number, isCorrect: boolean) => {
    const timeTaken = Math.floor((Date.now() - checkpointStartTime) / 1000);
    
    actions.answerCheckpoint(checkpointId, isCorrect);
    setCurrentCheckpoint(null);
    
    // Save checkpoint progress to database
    if (currentSessionId) {
      await saveCheckpointProgress(currentSessionId, checkpointId, isCorrect, timeTaken);
    }
    
    if (isCorrect) {
      toast.success("Resposta correta! +100 pontos e KPIs melhorados!");
    } else {
      toast.error("Resposta incorreta. -1 vida e KPIs reduzidos.");
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
      cp.completed || cp.id === checkpointId
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
      completed_checkpoints: gameState.checkpoints.filter(cp => cp.completed).length,
      accuracy_percentage: gameState.kpis.disponibilidade,
      delivery_efficiency: gameState.kpis.aceitacao,
      customer_satisfaction: gameState.kpis.avaliacao,
      is_completed: isCompleted
    };

    const session = await saveGameSession(currentPlayer.id, gameData);
    if (session && !currentSessionId) {
      setCurrentSessionId(session.id);
    }
  };

  // Login screen
  if (!gameState.currentUser) {
    return (
      <GameLogin
        onLogin={handleLogin}
        onGuestLogin={handleGuestLogin}
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
          userEmail={gameState.currentUser}
          stats={gameState.stats}
          kpis={gameState.kpis}
          onSettingsClick={() => setShowSettings(true)}
        />

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
          email: currentPlayer?.email || "jogador@example.com",
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
