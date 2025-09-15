import { useState } from 'react';

import {
  firebaseClient,
  type FirebasePlayerDocument,
  type FirebaseSessionDocument,
} from '@/integrations/firebase/client';

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
  checkpoints: 'ze-simulator.checkpoints',
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

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

const toBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return fallback;
};

const toStringOrUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() !== '' ? value : undefined;

const toStringOrNull = (value: unknown) => {
  const stringValue = toStringOrUndefined(value);
  return typeof stringValue === 'undefined' ? null : stringValue;
};

const ensureLocalPlayerRecord = (playerCode: string, name?: string): LocalPlayerRecord => {
  const now = new Date().toISOString();
  const players = getLocalPlayers();
  const existing = players.find(player => player.code === playerCode);

  if (existing) {
    const updated: LocalPlayerRecord = {
      ...existing,
      name: name ?? existing.name,
      updated_at: now,
    };

    storeLocalPlayers(players.map(player => (player.id === existing.id ? updated : player)));
    return updated;
  }

  const newPlayer: LocalPlayerRecord = {
    id: generateLocalId(),
    code: playerCode,
    name,
    created_at: now,
    updated_at: now,
  };

  storeLocalPlayers([...players, newPlayer]);
  return newPlayer;
};

const savePlayerLocally = (playerCode: string, name?: string): Player | null => {
  const record = ensureLocalPlayerRecord(playerCode, name);

  return {
    id: record.id,
    code: record.code,
    name: record.name,
  };
};

const saveSessionLocally = (
  player: Player,
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

  const relatedPlayer = ensureLocalPlayerRecord(player.code, player.name);

  const session: GameSession = {
    id: sessionId,
    player_id: player.id,
    completed_at: gameData.is_completed ? now : null,
    players: {
      email: relatedPlayer.code,
      name: relatedPlayer.name ?? undefined,
    },
    ...gameData,
  };

  const sessions = getLocalSessions();
  storeLocalSessions([...sessions, session]);

  return session;
};

const mapFirebasePlayer = (
  record: FirebasePlayerDocument,
  fallback: { code: string; name?: string },
) => {
  const code = toStringOrUndefined(record.fields.code) ?? fallback.code;
  const name = toStringOrUndefined(record.fields.name) ?? fallback.name;

  const player: Player = {
    id: record.id,
    code,
    ...(name ? { name } : {}),
  };

  return {
    player,
    documentName: record.documentName,
  };
};

const mapFirebaseSession = (record: FirebaseSessionDocument): GameSession | null => {
  const fields = record.fields;
  const playerId = toStringOrUndefined(fields.player_id);
  if (!playerId) return null;

  const email = toStringOrUndefined(fields.player_code) ?? playerId;
  const name = toStringOrUndefined(fields.player_name);

  return {
    id: record.id,
    player_id: playerId,
    score: toNumber(fields.score),
    lives_used: toNumber(fields.lives_used),
    total_time: toNumber(fields.total_time),
    completed_checkpoints: toNumber(fields.completed_checkpoints),
    accuracy_percentage: toNumber(fields.accuracy_percentage),
    delivery_efficiency: toNumber(fields.delivery_efficiency),
    customer_satisfaction: toNumber(fields.customer_satisfaction),
    completed_at: toStringOrNull(fields.completed_at),
    is_completed: toBoolean(fields.is_completed, false),
    players: {
      email,
      ...(name ? { name } : {}),
    },
  };
};

export const useDatabase = () => {
  const [loading, setLoading] = useState(false);

  const savePlayer = async (playerCode: string, name?: string): Promise<Player | null> => {
    try {
      setLoading(true);

      if (!firebaseClient.isConfigured) {
        return savePlayerLocally(playerCode, name);
      }

      const existingRecord = await firebaseClient.findPlayerByCode(playerCode);

      if (existingRecord) {
        const existing = mapFirebasePlayer(existingRecord, { code: playerCode, name });

        if (name && existing.player.name !== name) {
          const updatedRecord = await firebaseClient.updatePlayer(existing.documentName, {
            name,
            updated_at: new Date().toISOString(),
          }, ['name', 'updated_at']);

          const updated = mapFirebasePlayer(updatedRecord, { code: existing.player.code, name });
          return updated.player;
        }

        return existing.player;
      }

      const now = new Date().toISOString();
      const createdRecord = await firebaseClient.createPlayer({
        code: playerCode,
        name: name ?? null,
        created_at: now,
        updated_at: now,
      });

      const created = mapFirebasePlayer(createdRecord, { code: playerCode, name });
      return created.player;
    } catch (error) {
      console.warn('Não foi possível salvar o participante no Firebase. Registrando localmente.', error);
      return savePlayerLocally(playerCode, name);
    } finally {
      setLoading(false);
    }
  };

  const saveGameSession = async (
    player: Player,
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

      if (!firebaseClient.isConfigured) {
        return saveSessionLocally(player, gameData);
      }

      const now = new Date().toISOString();
      const payload = {
        player_id: player.id,
        player_code: player.code,
        player_name: player.name ?? null,
        score: gameData.score,
        lives_used: gameData.lives_used,
        total_time: gameData.total_time,
        completed_checkpoints: gameData.completed_checkpoints,
        accuracy_percentage: gameData.accuracy_percentage,
        delivery_efficiency: gameData.delivery_efficiency,
        customer_satisfaction: gameData.customer_satisfaction,
        completed_at: gameData.is_completed ? now : null,
        is_completed: gameData.is_completed,
        created_at: now,
        updated_at: now,
      };

      const record = await firebaseClient.createSession(payload);
      const mapped = mapFirebaseSession(record);
      if (mapped) {
        return mapped;
      }

      return {
        id: record.id,
        player_id: player.id,
        players: {
          email: player.code,
          ...(player.name ? { name: player.name } : {}),
        },
        completed_at: payload.completed_at,
        ...gameData,
      };
    } catch (error) {
      console.warn('Não foi possível registrar a sessão no Firebase. Salvando localmente.', error);
      return saveSessionLocally(player, gameData);
    } finally {
      setLoading(false);
    }
  };

  const saveCheckpointProgress = async (
    sessionId: string,
    checkpointId: number,
    answeredCorrectly: boolean,
    timeTaken: number,
  ) => {
    try {
      if (!firebaseClient.isConfigured) {
        throw new Error('Firebase não configurado');
      }

      await firebaseClient.logCheckpoint({
        session_id: sessionId,
        checkpoint_id: checkpointId,
        answered_correctly: answeredCorrectly,
        time_taken: timeTaken,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Não foi possível registrar o progresso do checkpoint no Firebase. Salvando localmente.', error);
      storeLocalCheckpoint({
        id: generateLocalId(),
        session_id: sessionId,
        checkpoint_id: checkpointId,
        answered_correctly: answeredCorrectly,
        time_taken: timeTaken,
        created_at: new Date().toISOString(),
      });
    }
  };

  const getCompletedSessions = async (): Promise<GameSession[]> => {
    try {
      if (!firebaseClient.isConfigured) {
        throw new Error('Firebase não configurado');
      }

      const records = await firebaseClient.listCompletedSessions();
      const sessions = records
        .map(mapFirebaseSession)
        .filter((session): session is GameSession => session !== null);

      const localCompleted = getLocalSessions().filter(session => session.is_completed);

      const combined = [...sessions, ...localCompleted];
      combined.sort((a, b) => {
        const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        return dateB - dateA;
      });

      return combined;
    } catch (error) {
      console.warn('Não foi possível carregar sessões do Firebase. Exibindo apenas os dados locais.', error);
      return getLocalSessions().filter(session => session.is_completed);
    }
  };

  return {
    loading,
    savePlayer,
    saveGameSession,
    saveCheckpointProgress,
    getCompletedSessions,
  };
};
