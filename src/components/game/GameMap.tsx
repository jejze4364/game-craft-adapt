import React, { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";

interface Position {
  x: number;
  y: number;
}

// "Melhor dos dois mundos": suportar ambos modelos de status
// - codex: "locked" | "current" | "completed" | "failed"
// - main:  "pending" | "completed" | "failed"
export type CheckpointStatus = "locked" | "current" | "pending" | "completed" | "failed";

export interface GameMapCheckpoint {
  id: number;
  x: number;
  y: number;
  completed: boolean; // mantido por compatibilidade, mas o "status" é a fonte da verdade visual
  status: CheckpointStatus;
}

interface GameMapProps {
  playerPosition: Position;
  onPositionChange: (position: Position) => void;
  checkpoints: GameMapCheckpoint[];
  onCheckpointReach: (checkpointId: number) => void;
}

const TILE_TYPES = {
  ROAD: 1,
  BLOCK: 0,
};

// 16x12 map layout matching the original
const MAP_LAYOUT = [
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
];

export const GameMap: React.FC<GameMapProps> = ({
  playerPosition,
  onPositionChange,
  checkpoints,
  onCheckpointReach,
}) => {
  const [showRoute, setShowRoute] = useState(false);

  const isInteractable = (status: CheckpointStatus) =>
    status === "current" || status === "failed" || status === "pending"; // permite jogar novamente ou iniciar pendente

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const { key } = event;
      let newX = playerPosition.x;
      let newY = playerPosition.y;

      // Movement controls
      if (key === "ArrowUp" || key === "w" || key === "W") {
        newY = Math.max(0, playerPosition.y - 1);
      } else if (key === "ArrowDown" || key === "s" || key === "S") {
        newY = Math.min(11, playerPosition.y + 1);
      } else if (key === "ArrowLeft" || key === "a" || key === "A") {
        newX = Math.max(0, playerPosition.x - 1);
      } else if (key === "ArrowRight" || key === "d" || key === "D") {
        newX = Math.min(15, playerPosition.x + 1);
      } else if (key === "i" || key === "I") {
        setShowRoute((v) => !v);
        return;
      }

      // Check if movement is valid (only on road tiles)
      if (MAP_LAYOUT[newY] && MAP_LAYOUT[newY][newX] === TILE_TYPES.ROAD) {
        const newPosition = { x: newX, y: newY };
        onPositionChange(newPosition);

        // Check for checkpoint collision
        const checkpoint = checkpoints.find(
          (cp) => cp.x === newX && cp.y === newY && isInteractable(cp.status)
        );
        if (checkpoint) {
          onCheckpointReach(checkpoint.id);
        }
      }
    },
    [playerPosition, onPositionChange, checkpoints]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  const renderTile = (y: number, x: number) => {
    const isRoad = MAP_LAYOUT[y][x] === TILE_TYPES.ROAD;
    const isPlayer = playerPosition.x === x && playerPosition.y === y;
    const checkpoint = checkpoints.find((cp) => cp.x === x && cp.y === y);

    let tileContent: React.ReactNode = null;
    let tileClasses =
      "w-[var(--tile-size)] h-[var(--tile-size)] border border-border/20 transition-all duration-200 flex items-center justify-center text-lg font-bold";

    if (isRoad) {
      tileClasses += " bg-game-road";

      if (isPlayer) {
        tileContent = "🏍️";
        tileClasses += " animate-pulse-glow";
      } else if (checkpoint) {
        // Interatividade visual apenas quando faz sentido
        if (isInteractable(checkpoint.status)) {
          tileClasses += " cursor-pointer";
        }

        if (checkpoint.status === "completed") {
          tileContent = "✅";
          tileClasses += " bg-ze-green text-primary-foreground";
        } else if (checkpoint.status === "failed") {
          tileContent = "❌";
          tileClasses += " bg-ze-red text-primary-foreground";
        } else if (checkpoint.status === "current") {
          tileContent = (
            <span className="text-base sm:text-lg font-extrabold text-primary-foreground">
              {checkpoint.id + 1}
            </span>
          );
          tileClasses += " bg-ze-yellow text-primary-foreground shadow-glow";
        } else if (checkpoint.status === "pending") {
          tileContent = "🍺"; // ícone neutro para checkpoint disponível
          tileClasses += " bg-game-checkpoint text-primary-foreground";
        } else {
          // locked
          tileContent = (
            <span className="flex flex-col items-center gap-0 text-[10px] sm:text-xs text-muted-foreground">
              <span>🔒</span>
              <span className="font-semibold">{checkpoint.id + 1}</span>
            </span>
          );
          tileClasses += " bg-muted/50 text-muted-foreground cursor-not-allowed";
        }
      } else if (x === 2 && y === 6) {
        // Store position
        tileContent = "🏪";
        tileClasses += " bg-ze-yellow text-primary-foreground";
      }
    } else {
      tileClasses += " bg-game-block";
    }

    return (
      <div
        key={`${y}-${x}`}
        className={tileClasses}
        onClick={() => {
          if (checkpoint) {
            if (checkpoint.status === "locked" || checkpoint.status === "completed") {
              return; // sem ação em locked/completed
            }
            onCheckpointReach(checkpoint.id);
            return;
          }

          if (isRoad) {
            onPositionChange({ x, y });
          }
        }}
        aria-label={checkpoint ? `Checkpoint ${checkpoint.id + 1} (${checkpoint.status})` : isPlayer ? "Jogador" : isRoad ? "Rua" : "Bloco"}
      >
        {/* Exibir traçado da rota quando showRoute estiver ativo */}
        {showRoute && isRoad && !isPlayer && !checkpoint ? (
          <span className="opacity-40 text-xs">·</span>
        ) : (
          tileContent
        )}
      </div>
    );
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Mapa da Cidade</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRoute((v) => !v)}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              showRoute
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
            aria-pressed={showRoute}
            aria-label="Alternar visualização da rota"
          >
            {showRoute ? "👁️" : "🗺️"}
          </button>
        </div>
      </div>

      <div
        className="grid gap-[var(--tile-gap)] mb-4 mx-auto w-fit"
        style={{
          gridTemplateColumns: `repeat(${MAP_LAYOUT[0].length}, var(--tile-size))`,
          gridTemplateRows: `repeat(${MAP_LAYOUT.length}, var(--tile-size))`,
        }}
      >
        {MAP_LAYOUT.map((row, y) => row.map((_, x) => renderTile(y, x)))}
      </div>

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>
          <strong>Controles:</strong> Use ↑↓←→ ou WASD para mover
        </p>
        <p>
          Pressione <kbd className="px-1 py-0.5 bg-muted rounded text-xs">I</kbd> para alternar rota
        </p>
        <div className="flex justify-center gap-4 mt-2">
          <span className="flex items-center gap-1">
            <span>🏪</span> Sua Loja
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-ze-yellow text-[10px] font-bold text-primary-foreground">1</span>
            Checkpoint atual
          </span>
          <span className="flex items-center gap-1">
            <span>🍺</span> Checkpoint (pendente)
          </span>
          <span className="flex items-center gap-1">
            <span>❌</span> Revisar conteúdo
          </span>
          <span className="flex items-center gap-1">
            <span>✅</span> Concluído
          </span>
          <span className="flex items-center gap-1">
            <span>🔒</span> Bloqueado
          </span>
        </div>
      </div>
    </Card>
  );
};
