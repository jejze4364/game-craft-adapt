import { useState } from 'react';

// Firebase é opcional: se configurado usamos, senão fallback em localStorage
import {
  firebaseClient,
  type FirebasePlayerDocument,
  type FirebaseSessionDocument,
} from '@/integrations/firebase/client';

export interface Player {
  id: string;
  code: string; // mapeia para players.email (ou email sintético <id>@local)
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

// ------------ utils local -------------
const isBrowser = typeof window !== 'undefined';

const generateLocalId = () => {
  if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
    return (crypto as any).randomUUID();
  }
  return `local-${Math.random().toString(36).slice(2, 11)}`;
};

const readLocalData = <T>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;
  try { const stored = window.localStorage.getItem(key); return stored ? (JSON.parse(stored) as T) : fallback; } 
  catch (e) { console.warn(`Não foi possível ler ${key}.`, e); return fallback; }
};

const writeLocalData = <T>(key: string, value: T) => {
  if (!isBrowser) return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } 
  catch (e) { console.warn(`Não foi possível salvar ${key}.`, e); }
};

// tipos auxiliares locais
 type LocalPlayerRecord = { id: string; code: string; name?: string; created_at: string; updated_at: string };
 type LocalCheckpointRecord = { id: string; session_id: string; checkpoint_id: number; answered_correctly: boolean; time_taken: number; created_at: string };

const getLocalPlayers = (): LocalPlayerRecord[] => readLocalData(LOCAL_STORAGE_KEYS.players, [] as LocalPlayerRecord[]);
const storeLocalPlayers = (players: LocalPlayerRecord[]) => writeLocalData(LOCAL_STORAGE_KEYS.players, players);
const getLocalSessions = (): GameSession[] => readLocalData(LOCAL_STORAGE_KEYS.sessions, [] as GameSession[]);
const storeLocalSessions = (sessions: GameSession[]) => writeLocalData(LOCAL_STORAGE_KEYS.sessions, sessions);
const storeLocalCheckpoint = (r: LocalCheckpointRecord) => { const cur = readLocalData(LOCAL_STORAGE_KEYS.checkpoints, [] as LocalCheckpointRecord[]); cur.push(r); writeLocalData(LOCAL_STORAGE_KEYS.checkpoints, cur); };

// normalizadores
const toNumber = (v: unknown, fb = 0) => typeof v === 'number' ? v : (typeof v === 'string' ? (Number.isNaN(Number(v)) ? fb : Number(v)) : fb);
const toBoolean = (v: unknown, fb = false) => typeof v === 'boolean' ? v : (typeof v === 'number' ? v !== 0 : (typeof v === 'string' ? ['true','1','yes'].includes(v.trim().toLowerCase()) : fb));
const toStringOrUndefined = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v : undefined);
const toStringOrNull = (v: unknown) => { const s = toStringOrUndefined(v); return typeof s === 'undefined' ? null : s; };

// persistência local de players/sessions
const ensureLocalPlayerRecord = (playerCode: string, name?: string): LocalPlayerRecord => {
  const now = new Date().toISOString();
  const players = getLocalPlayers();
  const existing = players.find(p => p.code === playerCode);
  if (existing) {
    const updated: LocalPlayerRecord = { ...existing, name: name ?? existing.name, updated_at: now };
    storeLocalPlayers(players.map(p => p.id === existing.id ? updated : p));
    return updated;
  }
  const created: LocalPlayerRecord = { id: generateLocalId(), code: playerCode, name, created_at: now, updated_at: now };
  storeLocalPlayers([...players, created]);
  return created;
};

const savePlayerLocally = (playerCode: string, name?: string): Player | null => {
  const rec = ensureLocalPlayerRecord(playerCode, name);
  return { id: rec.id, code: rec.code, name: rec.name };
};

const saveSessionLocally = (
  player: Player,
  gameData: { score: number; lives_used: number; total_time: number; completed_checkpoints: number; accuracy_percentage: number; delivery_efficiency: number; customer_satisfaction: number; is_completed: boolean }
): GameSession => {
  const now = new Date().toISOString();
  const sessionId = generateLocalId();
  const related = ensureLocalPlayerRecord(player.code, player.name);
  const session: GameSession = {
    id: sessionId,
    player_id: player.id,
    completed_at: gameData.is_completed ? now : null,
    players: { email: related.code, name: related.name ?? undefined },
    ...gameData,
  };
  const sessions = getLocalSessions();
  storeLocalSessions([...sessions, session]);
  return session;
};

// mapeamentos Firebase
const mapFirebasePlayer = (record: FirebasePlayerDocument, fallback: { code: string; name?: string }) => {
  const code = toStringOrUndefined(record.fields.code) ?? fallback.code;
  const name = toStringOrUndefined(record.fields.name) ?? fallback.name;
  const player: Player = { id: record.id, code, ...(name ? { name } : {}) };
  return { player, documentName: record.documentName };
};

const mapFirebaseSession = (record: FirebaseSessionDocument): GameSession | null => {
  const f = record.fields;
  const playerId = toStringOrUndefined(f.player_id);
  if (!playerId) return null;
  const email = toStringOrUndefined(f.player_code) ?? playerId;
  const name = toStringOrUndefined(f.player_name);
  return {
    id: record.id,
    player_id: playerId,
    score: toNumber(f.score),
    lives_used: toNumber(f.lives_used),
    total_time: toNumber(f.total_time),
    completed_checkpoints: toNumber(f.completed_checkpoints),
    accuracy_percentage: toNumber(f.accuracy_percentage),
    delivery_efficiency: toNumber(f.delivery_efficiency),
    customer_satisfaction: toNumber(f.customer_satisfaction),
    completed_at: toStringOrNull(f.completed_at),
    is_completed: toBoolean(f.is_completed, false),
    players: { email, ...(name ? { name } : {}) },
  };
};

// quando vier de outro backend no formato {id,email,name}
const mapPlayer = (dbPlayer: { id: string; email: string; name?: string } | null): Player | null => dbPlayer ? ({ id: dbPlayer.id, code: dbPlayer.email, name: dbPlayer.name ?? undefined }) : null;

export const useDatabase = () => {
  const [loading, setLoading] = useState(false);

  // Salva/atualiza Player — Firebase se disponível, senão local
  const savePlayer = async (playerCode: string, name?: string): Promise<Player | null> => {
    try {
      setLoading(true);

      if (!firebaseClient?.isConfigured) {
        // compat com storage antigo
        const playersKey = 'ze_delivery_players';
        const list = readLocalData(playersKey, [] as any[]);
        const found = list.find((p) => p.code === playerCode);
        if (found) {
          if (name && found.name !== name) { found.name = name; writeLocalData(playersKey, list); }
          return { id: found.id, code: found.code, name: found.name } as Player;
        }
        const newPlayer: Player = { id: generateLocalId(), code: playerCode, name: name || undefined };
        list.push(newPlayer); writeLocalData(playersKey, list);
        return newPlayer;
      }

      // Firebase
      const existingRecord = await firebaseClient.findPlayerByCode(playerCode);
      if (existingRecord) {
        const existing = mapFirebasePlayer(existingRecord, { code: playerCode, name });
        if (name && existing.player.name !== name) {
          const updatedRecord = await firebaseClient.updatePlayer(
            existing.documentName,
            { name, updated_at: new Date().toISOString() },
            ['name', 'updated_at']
          );
          return mapFirebasePlayer(updatedRecord, { code: existing.player.code, name }).player;
        }
        return existing.player;
      }

      const now = new Date().toISOString();
      const createdRecord = await firebaseClient.createPlayer({ code: playerCode, name: name ?? null, created_at: now, updated_at: now });
      return mapFirebasePlayer(createdRecord, { code: playerCode, name }).player;
    } catch (error) {
      console.warn('Não foi possível salvar o participante no Firebase. Registrando localmente.', error);
      return savePlayerLocally(playerCode, name);
    } finally { setLoading(false); }
  };

  // Cria sessão vazia (login)
  const createSession = async (playerId: string): Promise<GameSession | null> => {
    try {
      setLoading(true);

      if (!firebaseClient?.isConfigured) {
        const newSession: GameSession = {
          id: generateLocalId(),
          player_id: playerId,
          score: 0,
          lives_used: 0,
          total_time: 0,
          completed_checkpoints: 0,
          accuracy_percentage: 0,
          delivery_efficiency: 0,
          customer_satisfaction: 0,
          completed_at: null,
          is_completed: false,
        };
        const sessions = getLocalSessions();
        storeLocalSessions([...sessions, newSession]);
        return newSession;
      }

      const now = new Date().toISOString();
      const record = await firebaseClient.createSession({
        player_id: playerId,
        player_code: playerId,
        player_name: null,
        score: 0,
        lives_used: 0,
        total_time: 0,
        completed_checkpoints: 0,
        accuracy_percentage: 0,
        delivery_efficiency: 0,
        customer_satisfaction: 0,
        completed_at: null,
        is_completed: false,
        created_at: now,
        updated_at: now,
      });
      return mapFirebaseSession(record);
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    } finally { setLoading(false); }
  };

  // Atualiza sessão existente
  const updateGameSession = async (
    sessionId: string,
    gameData: { score: number; lives_used: number; total_time: number; completed_checkpoints: number; accuracy_percentage: number; delivery_efficiency: number; customer_satisfaction: number; is_completed: boolean }
  ): Promise<GameSession | null> => {
    try {
      setLoading(true);

      if (!firebaseClient?.isConfigured) {
        const sessions = getLocalSessions();
        const idx = sessions.findIndex((s) => s.id === sessionId);
        if (idx !== -1) {
          const updated: GameSession = { ...sessions[idx], ...gameData, completed_at: gameData.is_completed ? new Date().toISOString() : null };
          sessions[idx] = updated; storeLocalSessions(sessions); return updated;
        }
        return null;
      }

      const now = new Date().toISOString();
      const record = await firebaseClient.updateSession(sessionId, { ...gameData, updated_at: now }, [
        'score','lives_used','total_time','completed_checkpoints','accuracy_percentage','delivery_efficiency','customer_satisfaction','is_completed','updated_at','completed_at'
      ]);
      return mapFirebaseSession(record);
    } catch (error) {
      console.error('Error updating session:', error);
      return null;
    } finally { setLoading(false); }
  };

  // Insert de sessão completa (fallback)
  const saveGameSession = async (
    playerOrPlayerId: Player | string,
    gameData: { score: number; lives_used: number; total_time: number; completed_checkpoints: number; accuracy_percentage: number; delivery_efficiency: number; customer_satisfaction: number; is_completed: boolean }
  ): Promise<GameSession | null> => {
    try {
      setLoading(true);

      const playerId = typeof playerOrPlayerId === 'string' ? playerOrPlayerId : playerOrPlayerId.id;
      const playerEmail = typeof playerOrPlayerId === 'string' ? undefined : playerOrPlayerId.code;
      const playerName = typeof playerOrPlayerId === 'string' ? undefined : playerOrPlayerId.name;

      if (!firebaseClient?.isConfigured) {
        const player: Player = typeof playerOrPlayerId === 'string' ? { id: playerOrPlayerId, code: `${playerOrPlayerId}@local` } : playerOrPlayerId;
        return saveSessionLocally(player, gameData);
      }

      const now = new Date().toISOString();
      const payload = {
        player_id: playerId,
        player_code: playerEmail ?? playerId,
        player_name: playerName ?? null,
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
      if (mapped) return mapped;
      return { id: record.id, player_id: playerId, players: { email: playerEmail ?? playerId, ...(playerName ? { name: playerName } : {}) }, completed_at: payload.completed_at, ...gameData };
    } catch (error) {
      console.warn('Não foi possível registrar a sessão no Firebase. Salvando localmente.', error);
      const player: Player = typeof playerOrPlayerId === 'string' ? { id: playerOrPlayerId, code: `${playerOrPlayerId}@local` } : playerOrPlayerId;
      return saveSessionLocally(player, gameData);
    } finally { setLoading(false); }
  };

  // Progresso de checkpoint
  const saveCheckpointProgress = async (sessionId: string, checkpointId: number, answeredCorrectly: boolean, timeTaken: number) => {
    try {
      if (!firebaseClient?.isConfigured) { throw new Error('Firebase não configurado'); }
      await firebaseClient.logCheckpoint({ session_id: sessionId, checkpoint_id: checkpointId, answered_correctly: answeredCorrectly, time_taken: timeTaken, created_at: new Date().toISOString() });
    } catch (error) {
      console.warn('Falha ao registrar checkpoint no Firebase. Salvando localmente.', error);
      storeLocalCheckpoint({ id: generateLocalId(), session_id: sessionId, checkpoint_id: checkpointId, answered_correctly: answeredCorrectly, time_taken: timeTaken, created_at: new Date().toISOString() });
    }
  };

  // Sessões concluídas (relatórios)
  const getCompletedSessions = async (): Promise<GameSession[]> => {
    try {
      if (!firebaseClient?.isConfigured) { throw new Error('Firebase não configurado'); }
      const records = await firebaseClient.listCompletedSessions();
      const sessions = records.map(mapFirebaseSession).filter((s): s is GameSession => s !== null);
      const localCompleted = getLocalSessions().filter((s) => s.is_completed);
      const combined = [...sessions, ...localCompleted];
      combined.sort((a, b) => {
        const da = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const db = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        return db - da;
      });
      return combined;
    } catch (error) {
      console.warn('Não foi possível carregar sessões do Firebase. Exibindo apenas dados locais.', error);
      return getLocalSessions().filter((s) => s.is_completed);
    }
  };

  return { loading, savePlayer, createSession, updateGameSession, saveGameSession, saveCheckpointProgress, getCompletedSessions } as const;
};