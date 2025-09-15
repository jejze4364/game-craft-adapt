import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Player {
  id: string;
  code: string;
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

const LOCAL_STORAGE_KEYS = {
  players: 'ze-simulator.players',
  sessions: 'ze-simulator.sessions',
  checkpoints: 'ze-simulator.checkpoints'
} as const;

type LocalPlayerRecord = {
  id: string;
  code: string;
  name?: string;
  created_at: string;
  updated_at: string;
};

type LocalCheckpointRecord = {
  id: string;
  session_id: string;
  checkpoint_id: number;
  answered_correctly: boolean;
  time_taken: number;
  created_at: string;
};

const isBrowser = typeof window !== 'undefined';

const generateLocalId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `local-${Math.random().toString(36).slice(2, 11)}`;
};

const readLocalData = <T>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;

  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return fallback;
    return JSON.parse(stored) as T;
  } catch (error) {
    console.warn(`Não foi possível ler os dados locais de ${key}.`, error);
    return fallback;
  }
};

const writeLocalData = <T>(key: string, value: T) => {
  if (!isBrowser) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Não foi possível salvar os dados locais de ${key}.`, error);
  }
};

const getLocalPlayers = (): LocalPlayerRecord[] =>
  readLocalData(LOCAL_STORAGE_KEYS.players, [] as LocalPlayerRecord[]);

const storeLocalPlayers = (players: LocalPlayerRecord[]) =>
  writeLocalData(LOCAL_STORAGE_KEYS.players, players);

const getLocalSessions = (): GameSession[] =>
  readLocalData(LOCAL_STORAGE_KEYS.sessions, [] as GameSession[]);

const storeLocalSessions = (sessions: GameSession[]) =>
  writeLocalData(LOCAL_STORAGE_KEYS.sessions, sessions);

const storeLocalCheckpoint = (record: LocalCheckpointRecord) => {
  const current = readLocalData(LOCAL_STORAGE_KEYS.checkpoints, [] as LocalCheckpointRecord[]);
  current.push(record);
  writeLocalData(LOCAL_STORAGE_KEYS.checkpoints, current);
};

const savePlayerLocally = (playerCode: string, name?: string): Player | null => {
  const now = new Date().toISOString();
  const players = getLocalPlayers();
  const existing = players.find(player => player.code === playerCode);

  if (existing) {
    const updated: LocalPlayerRecord = {
      ...existing,
      name: name ?? existing.name,
      updated_at: now
    };

    storeLocalPlayers(players.map(player => (player.id === existing.id ? updated : player)));

    return {
      id: updated.id,
      code: updated.code,
      name: updated.name
    };
  }

  const newPlayer: LocalPlayerRecord = {
    id: generateLocalId(),
    code: playerCode,
    name,
    created_at: now,
    updated_at: now
  };

  storeLocalPlayers([...players, newPlayer]);

  return {
    id: newPlayer.id,
    code: newPlayer.code,
    name: newPlayer.name
  };
};

const saveSessionLocally = (
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
): GameSession => {
  const now = new Date().toISOString();
  const sessionId = generateLocalId();
  const players = getLocalPlayers();
  const relatedPlayer = players.find(player => player.id === playerId);

  const session: GameSession = {
    id: sessionId,
    player_id: playerId,
    completed_at: gameData.is_completed ? now : null,
    players: relatedPlayer
      ? {
          email: relatedPlayer.code,
          name: relatedPlayer.name
        }
      : undefined,
    ...gameData
  };

  const sessions = getLocalSessions();
  storeLocalSessions([...sessions, session]);

  return session;
};

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

  const savePlayer = async (playerCode: string, name?: string): Promise<Player | null> => {
    try {
      setLoading(true);

      // Check if player already exists
      const { data: existingPlayer, error: fetchError } = await supabase
        .from('players')
        .select('*')
        .eq('email', playerCode)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingPlayer) {
        if (name && existingPlayer.name !== name) {
          const { data: updatedPlayer, error: updateError } = await supabase
            .from('players')
            .update({ name })
            .eq('id', existingPlayer.id)
            .select()
            .single();

          if (updateError) throw updateError;
          return mapPlayer(updatedPlayer);
        }
        return mapPlayer(existingPlayer);
      }

      // Create new player
      const { data: newPlayer, error } = await supabase
        .from('players')
        .insert([{ email: playerCode, name }])
        .select()
        .single();

      if (error) throw error;
      return mapPlayer(newPlayer);
    } catch (error) {
      console.warn('Não foi possível salvar o participante no Supabase. Registrando localmente.', error);
      return savePlayerLocally(playerCode, name);
    } finally {
      setLoading(false);
    }
  };

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

      const { data: session, error } = await supabase
        .from('game_sessions')
        .insert([{ player_id: playerId, ...gameData }])
        .select()
        .single();

      if (error) throw error;
      return session;
    } catch (error) {
      console.warn('Não foi possível registrar a sessão no Supabase. Salvando localmente.', error);
      return saveSessionLocally(playerId, gameData);
    } finally {
      setLoading(false);
    }
  };

  const saveCheckpointProgress = async (
    sessionId: string,
    checkpointId: number,
    answeredCorrectly: boolean,
    timeTaken: number
  ) => {
    try {
      const { error } = await supabase
        .from('checkpoints_progress')
        .insert([{
          session_id: sessionId,
          checkpoint_id: checkpointId,
          answered_correctly: answeredCorrectly,
          time_taken: timeTaken
        }]);

      if (error) throw error;
    } catch (error) {
      console.warn('Não foi possível registrar o progresso do checkpoint no Supabase. Salvando localmente.', error);
      storeLocalCheckpoint({
        id: generateLocalId(),
        session_id: sessionId,
        checkpoint_id: checkpointId,
        answered_correctly: answeredCorrectly,
        time_taken: timeTaken,
        created_at: new Date().toISOString()
      });
    }
  };

  const getCompletedSessions = async (): Promise<GameSession[]> => {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select(`
          *,
          players (
            email,
            name
          )
        `)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const localCompleted = getLocalSessions().filter(session => session.is_completed);
      return [...(data || []), ...localCompleted];
    } catch (error) {
      console.warn('Não foi possível carregar sessões do Supabase. Exibindo apenas os dados locais.', error);
      return getLocalSessions().filter(session => session.is_completed);
    }
  };

  return {
    loading,
    savePlayer,
    saveGameSession,
    saveCheckpointProgress,
    getCompletedSessions
  };
};
