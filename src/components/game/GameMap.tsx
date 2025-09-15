import React, { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";

interface Position {
  x: number;
  y: number;
}

interface GameMapCheckpoint {
  id: number;
  x: number;
  y: number;
  completed: boolean;
  status: "pending" | "completed" | "failed";
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
  onCheckpointReach
}) => {
  const [showRoute, setShowRoute] = useState(false);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
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
      setShowRoute(!showRoute);
      return;
    }

    // Check if movement is valid (only on road tiles)
    if (MAP_LAYOUT[newY] && MAP_LAYOUT[newY][newX] === TILE_TYPES.ROAD) {
      const newPosition = { x: newX, y: newY };
      onPositionChange(newPosition);

      // Check for checkpoint collision
      const checkpoint = checkpoints.find(
        (cp) => cp.x === newX && cp.y === newY && cp.status !== "completed"
      );
      if (checkpoint) {
        onCheckpointReach(checkpoint.id);
      }
    }
  }, [playerPosition, onPositionChange, checkpoints, onCheckpointReach, showRoute]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  const renderTile = (y: number, x: number) => {
    const isRoad = MAP_LAYOUT[y][x] === TILE_TYPES.ROAD;
    const isPlayer = playerPosition.x === x && playerPosition.y === y;
    const checkpoint = checkpoints.find(cp => cp.x === x && cp.y === y);
    
    let tileContent = null;
    let tileClasses = "w-[var(--tile-size)] h-[var(--tile-size)] border border-border/20 transition-all duration-200 flex items-center justify-center text-lg font-bold";

    if (isRoad) {
      tileClasses += " bg-game-road";

      if (isPlayer) {
        tileContent = "🏍️";
        tileClasses += " animate-pulse-glow";
      } else if (checkpoint) {
        tileClasses += " cursor-pointer";

        if (checkpoint.status === "completed") {
          tileContent = "✅";
          tileClasses += " bg-ze-green text-primary-foreground";
        } else if (checkpoint.status === "failed") {
          tileContent = "❌";
          tileClasses += " bg-ze-red text-primary-foreground";
        } else {
          tileContent = "📦";
          tileClasses += " bg-game-checkpoint text-primary-foreground animate-float";
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
            onCheckpointReach(checkpoint.id);
            return;
          }

          if (isRoad) {
            onPositionChange({ x, y });
          }
        }}
      >
        {tileContent}
      </div>
    );
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Mapa da Cidade</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRoute(!showRoute)}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              showRoute 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {showRoute ? "👁️" : "🗺️"}
          </button>
        </div>
      </div>
      
      <div 
        className="grid gap-[var(--tile-gap)] mb-4 mx-auto w-fit"
        style={{
          gridTemplateColumns: `repeat(${MAP_LAYOUT[0].length}, var(--tile-size))`,
          gridTemplateRows: `repeat(${MAP_LAYOUT.length}, var(--tile-size))`
        }}
      >
        {MAP_LAYOUT.map((row, y) =>
          row.map((_, x) => renderTile(y, x))
        )}
      </div>

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p><strong>Controles:</strong> Use ↑↓←→ ou WASD para mover</p>
        <p>Pressione <kbd className="px-1 py-0.5 bg-muted rounded text-xs">I</kbd> para alternar rota</p>
        <div className="flex justify-center gap-4 mt-2">
          <span className="flex items-center gap-1">
            <span>🏪</span> Sua Loja
          </span>
          <span className="flex items-center gap-1">
            <span>📦</span> Checkpoint
          </span>
          <span className="flex items-center gap-1">
            <span>❌</span> Revisar conteúdo
          </span>
          <span className="flex items-center gap-1">
            <span>✅</span> Concluído
          </span>
        </div>
      </div>
    </Card>
  );
};