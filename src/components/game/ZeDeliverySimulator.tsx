import React, { useState } from "react";
import { GameLogin } from "./GameLogin";
import { GameMap } from "./GameMap";
import { GameHUD } from "./GameHUD";
import { CheckpointModal } from "./CheckpointModal";
import { SettingsModal } from "./SettingsModal";
import { useGameState } from "@/hooks/useGameState";
import { toast } from "sonner";

export const ZeDeliverySimulator: React.FC = () => {
  const { gameState, actions } = useGameState();
  const [currentCheckpoint, setCurrentCheckpoint] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setLoginLoading(true);
    setLoginError("");

    try {
      // Simulate login process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (password.length < 6) {
        throw new Error("Senha deve ter pelo menos 6 caracteres");
      }

      actions.startGame(email);
      toast.success(`Bem-vindo, ${email.split('@')[0]}!`);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Erro no login");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGuestLogin = () => {
    actions.startGame("Convidado");
    toast.success("Bem-vindo, Convidado!");
  };

  const handleCheckpointReach = (checkpointId: number) => {
    const checkpoint = gameState.checkpoints.find(cp => cp.id === checkpointId);
    if (checkpoint && !checkpoint.completed) {
      setCurrentCheckpoint(checkpointId);
      toast.info("Checkpoint encontrado! Responda a questão educativa.");
    }
  };

  const handleAnswer = (checkpointId: number, isCorrect: boolean) => {
    actions.answerCheckpoint(checkpointId, isCorrect);
    setCurrentCheckpoint(null);
    
    if (isCorrect) {
      toast.success("Resposta correta! +100 pontos e KPIs melhorados!");
    } else {
      toast.error("Resposta incorreta. -1 vida e KPIs reduzidos.");
    }

    // Check game over
    if (gameState.stats.lives <= 1 && !isCorrect) {
      setTimeout(() => {
        toast.error("Game Over! Suas vidas acabaram.");
        actions.resetGame();
      }, 2000);
    }

    // Check victory
    const completedCount = gameState.checkpoints.filter(cp => cp.completed).length;
    if (completedCount === gameState.checkpoints.length && isCorrect) {
      setTimeout(() => {
        toast.success("🎉 Parabéns! Você completou todos os 15 checkpoints do simulador!");
      }, 2000);
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
    </div>
  );
};