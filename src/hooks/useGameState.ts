import { useState, useEffect, useCallback } from "react";

interface Position {
  x: number;
  y: number;
}

interface GameStats {
  lives: number;
  score: number;
  completedTasks: number;
  accuracy: number;
  sessionTime: string;
}

interface KPIData {
  disponibilidade: number;
  aceitacao: number;
  tempoEntrega: number;
  avaliacao: number;
}

interface GameSettings {
  sound: boolean;
  animations: boolean;
  speed: number;
}

interface CheckpointData {
  id: number;
  x: number;
  y: number;
  video: string;
  context: string;
  situation: string;
  options: string[];
  correct: number | string;
  hint: string;
  type?: "text" | "multiple";
  completed: boolean;
}

interface GameState {
  // User & Session
  currentUser: string | null;
  sessionStartTime: number;
  
  // Player
  playerPosition: Position;
  
  // Game Stats
  stats: GameStats;
  kpis: KPIData;
  settings: GameSettings;
  
  // Game Content
  checkpoints: CheckpointData[];
  correctAnswers: number;
  totalQuestions: number;
}

const INITIAL_CHECKPOINTS: Omit<CheckpointData, 'completed'>[] = [
  { id: 0, x: 3, y: 2, video: "videos/01-introducao.mp4", context: "Você precisa abrir a loja na plataforma.", situation: "A abertura e fechamento da loja na plataforma é...", options: ["Automático por agendamento", "Manual pelo botão verde", "Automático por horário cadastrado", "Feito pelo chat"], correct: 1, hint: "Botão verde de abrir/fechar." },
  { id: 1, x: 6, y: 3, video: "videos/02-disponibilidade.mp4", context: "O que significa taxa de disponibilidade?", situation: "Taxa de disponibilidade mede:", options: ["Pedidos aceitos/recebidos", "Tempo aberto vs horário cadastrado", "Tempo médio de entrega", "Quantidade de itens ativos"], correct: 1, hint: "Disponibilidade = loja aberta." },
  { id: 2, x: 9, y: 2, video: "videos/03-portfolio.mp4", context: "Um cliente não achou o produto. Você pensa no portfólio ideal.", situation: "Portfólio ideal significa:", options: ["Só cervejas", "% de itens recomendados ativos e prontos", "Itens com nota 5", "Itens sem marca"], correct: 1, hint: "Itens prontos e variados." },
  { id: 3, x: 13, y: 3, video: "videos/04-aceitacao.mp4", context: "Chegam vários pedidos. O que prejudica a taxa de aceitação?", situation: "Taxa de aceitação cai com:", options: ["Expirados/rejeitados/cancelados", "Abrir mais cedo", "Mais entregadores", "Portfólio alto"], correct: 0, hint: "Aceite em até ~3 min." },
  { id: 4, x: 2, y: 5, video: "videos/05-rastreio.mp4", context: "Cliente quer rastrear o pedido. O que é necessário?", situation: "Para boa taxa de rastreio é necessário:", options: ["GPS habilitado + finalizar no cliente", "Só Wi-Fi", "Sem app do entregador", "Dados móveis off"], correct: 0, hint: "App + GPS ativo." },
];

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentUser: null,
    sessionStartTime: 0,
    playerPosition: { x: 2, y: 6 }, // Store position
    stats: {
      lives: 3,
      score: 0,
      completedTasks: 0,
      accuracy: 0,
      sessionTime: "00:00"
    },
    kpis: {
      disponibilidade: 70,
      aceitacao: 70,
      tempoEntrega: 70,
      avaliacao: 70
    },
    settings: {
      sound: true,
      animations: true,
      speed: 1
    },
    checkpoints: INITIAL_CHECKPOINTS.map(cp => ({ ...cp, completed: false })),
    correctAnswers: 0,
    totalQuestions: 0
  });

  // Session timer
  useEffect(() => {
    if (!gameState.sessionStartTime) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - gameState.sessionStartTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      
      setGameState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          sessionTime: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.sessionStartTime]);

  // Calculate accuracy
  useEffect(() => {
    const accuracy = gameState.totalQuestions > 0 
      ? Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100)
      : 0;
    
    setGameState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        accuracy
      }
    }));
  }, [gameState.correctAnswers, gameState.totalQuestions]);

  const startGame = useCallback((userEmail: string) => {
    setGameState(prev => ({
      ...prev,
      currentUser: userEmail,
      sessionStartTime: Date.now(),
    }));
  }, []);

  const movePlayer = useCallback((newPosition: Position) => {
    setGameState(prev => ({
      ...prev,
      playerPosition: newPosition
    }));
  }, []);

  const answerCheckpoint = useCallback((checkpointId: number, isCorrect: boolean) => {
    setGameState(prev => {
      const newCheckpoints = prev.checkpoints.map(cp =>
        cp.id === checkpointId ? { ...cp, completed: true } : cp
      );

      const newStats = {
        ...prev.stats,
        completedTasks: newCheckpoints.filter(cp => cp.completed).length,
        score: prev.stats.score + (isCorrect ? 100 : 0),
        lives: isCorrect ? prev.stats.lives : Math.max(0, prev.stats.lives - 1)
      };

      // Update KPIs based on answer
      const kpiBonus = isCorrect ? 5 : -3;
      const newKpis = {
        disponibilidade: Math.max(0, Math.min(100, prev.kpis.disponibilidade + kpiBonus)),
        aceitacao: Math.max(0, Math.min(100, prev.kpis.aceitacao + kpiBonus)),
        tempoEntrega: Math.max(0, Math.min(100, prev.kpis.tempoEntrega + kpiBonus)),
        avaliacao: Math.max(0, Math.min(100, prev.kpis.avaliacao + kpiBonus)),
      };

      return {
        ...prev,
        checkpoints: newCheckpoints,
        stats: newStats,
        kpis: newKpis,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        totalQuestions: prev.totalQuestions + 1
      };
    });
  }, []);

  const updateSettings = useCallback((newSettings: GameSettings) => {
    setGameState(prev => ({
      ...prev,
      settings: newSettings
    }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      playerPosition: { x: 2, y: 6 },
      stats: {
        lives: 3,
        score: 0,
        completedTasks: 0,
        accuracy: 0,
        sessionTime: "00:00"
      },
      kpis: {
        disponibilidade: 70,
        aceitacao: 70,
        tempoEntrega: 70,
        avaliacao: 70
      },
      checkpoints: INITIAL_CHECKPOINTS.map(cp => ({ ...cp, completed: false })),
      correctAnswers: 0,
      totalQuestions: 0,
      sessionStartTime: Date.now()
    }));
  }, []);

  return {
    gameState,
    actions: {
      startGame,
      movePlayer,
      answerCheckpoint,
      updateSettings,
      resetGame
    }
  };
};