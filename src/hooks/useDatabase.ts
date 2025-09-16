import { useState } from 'react';

export interface Player {
  id: string;
  code: string; // mapeia para players.email
  name?: string;
}

export interface GameSession {
  id: string;
  player_id: string;
  score: number;
  lives_used: number;
  total_time: number;
  completed_checkpoints: number;
  accuracy_percentage: number;
  delivery_efficiency: number;
  customer_satisfaction: number;
  completed_at: string | null;
  is_completed: boolean;
  players?: {
    email: string;
    name?: string;
  };
}

// converte o formato do banco para o Player usado no app
const mapPlayer = (dbPlayer: { id: string; email: string; name?: string } | null): Player | null => {
  if (!dbPlayer) return null;
  return {
    id: dbPlayer.id,
    code: dbPlayer.email,
    name: dbPlayer.name ?? undefined,
  };
};

export const useDatabase = () => {
  const [loading, setLoading] = useState(false);

  // playerCode é o "email sintético" (<id>@local)
  const savePlayer = async (playerCode: string, name?: string): Promise<Player | null> => {
    try {
      setLoading(true);

      // Busca ou cria jogador no localStorage
      const playersKey = 'ze_delivery_players';
      const existingPlayers = JSON.parse(localStorage.getItem(playersKey) || '[]');
      
      let player = existingPlayers.find((p: any) => p.code === playerCode);
      
      if (player) {
        // Atualiza o nome se mudou
        if (name && player.name !== name) {
          player.name = name;
          localStorage.setItem(playersKey, JSON.stringify(existingPlayers));
        }
        return player;
      }

      // Cria novo jogador
      const newPlayer: Player = {
        id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        code: playerCode,
        name: name || undefined
      };
      
      existingPlayers.push(newPlayer);
      localStorage.setItem(playersKey, JSON.stringify(existingPlayers));
      
      return newPlayer;
    } catch (error) {
      console.error('Error saving player:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Cria sessão vazia no login (para já registrar checkpoints)
  const createSession = async (playerId: string): Promise<GameSession | null> => {
    try {
      setLoading(true);
      
      const newSession: GameSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        player_id: playerId,
        score: 0,
        lives_used: 0,
        total_time: 0,
        completed_checkpoints: 0,
        accuracy_percentage: 0,
        delivery_efficiency: 0,
        customer_satisfaction: 0,
        completed_at: null,
        is_completed: false
      };
      
      const sessionsKey = 'ze_delivery_sessions';
      const existingSessions = JSON.parse(localStorage.getItem(sessionsKey) || '[]');
      existingSessions.push(newSession);
      localStorage.setItem(sessionsKey, JSON.stringify(existingSessions));
      
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Atualiza uma sessão existente
  const updateGameSession = async (
    sessionId: string,
    gameData: {
      score: number;
      lives_used: number;
      total_time: number;
      completed_checkpoints: number;
      accuracy_percentage: number;
      delivery_efficiency: number;
      customer_satisfaction: number;
      is_completed: boolean;
    }
  ): Promise<GameSession | null> => {
    try {
      setLoading(true);
      
      const sessionsKey = 'ze_delivery_sessions';
      const sessions = JSON.parse(localStorage.getItem(sessionsKey) || '[]');
      const sessionIndex = sessions.findIndex((s: GameSession) => s.id === sessionId);
      
      if (sessionIndex !== -1) {
        sessions[sessionIndex] = {
          ...sessions[sessionIndex],
          ...gameData,
          completed_at: gameData.is_completed ? new Date().toISOString() : null
        };
        localStorage.setItem(sessionsKey, JSON.stringify(sessions));
        return sessions[sessionIndex];
      }
      
      return null;
    } catch (error) {
      console.error('Error updating session:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Insert de sessão completa (fallback, se não houve createSession)
  const saveGameSession = async (
    playerId: string,
    gameData: {
      score: number;
      lives_used: number;
      total_time: number;
      completed_checkpoints: number;
      accuracy_percentage: number;
      delivery_efficiency: number;
      customer_satisfaction: number;
      is_completed: boolean;
    }
  ): Promise<GameSession | null> => {
    try {
      setLoading(true);
      
      const newSession: GameSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        player_id: playerId,
        ...gameData,
        completed_at: gameData.is_completed ? new Date().toISOString() : null
      };
      
      const sessionsKey = 'ze_delivery_sessions';
      const sessions = JSON.parse(localStorage.getItem(sessionsKey) || '[]');
      sessions.push(newSession);
      localStorage.setItem(sessionsKey, JSON.stringify(sessions));
      
      return newSession;
    } catch (error) {
      console.error('Error saving session:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Salva progresso de um checkpoint específico
  const saveCheckpointProgress = async (
    sessionId: string,
    checkpointId: number,
    answeredCorrectly: boolean,
    timeTaken: number,
  ) => {
    try {
      const checkpointProgress = {
        id: `checkpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        session_id: sessionId,
        checkpoint_id: checkpointId,
        answered_correctly: answeredCorrectly,
        time_taken: timeTaken,
        created_at: new Date().toISOString()
      };
      
      const progressKey = 'ze_delivery_checkpoint_progress';
      const progress = JSON.parse(localStorage.getItem(progressKey) || '[]');
      progress.push(checkpointProgress);
      localStorage.setItem(progressKey, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving checkpoint progress:', error);
    }
  };

  // Busca sessões completas (para relatórios)
  const getCompletedSessions = async (): Promise<GameSession[]> => {
    try {
      const sessionsKey = 'ze_delivery_sessions';
      const playersKey = 'ze_delivery_players';
      
      const sessions = JSON.parse(localStorage.getItem(sessionsKey) || '[]');
      const players = JSON.parse(localStorage.getItem(playersKey) || '[]');
      
      return sessions
        .filter((session: GameSession) => session.is_completed)
        .map((session: GameSession) => {
          const player = players.find((p: Player) => p.id === session.player_id);
          return {
            ...session,
            players: player ? {
              email: player.code,
              name: player.name
            } : undefined
          };
        })
        .sort((a: GameSession, b: GameSession) => 
          new Date(b.completed_at || '').getTime() - new Date(a.completed_at || '').getTime()
        );
    } catch (error) {
      console.error('Error fetching completed sessions:', error);
      return [];
    }
  };

  return {
    loading,
    savePlayer,
    createSession,
    updateGameSession,
    saveGameSession,
    saveCheckpointProgress,
    getCompletedSessions,
  };
};