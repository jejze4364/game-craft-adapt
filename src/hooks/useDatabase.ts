import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Player {
  id: string;
  email: string;
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
}

export const useDatabase = () => {
  const [loading, setLoading] = useState(false);

  const savePlayer = async (email: string, name?: string): Promise<Player | null> => {
    try {
      setLoading(true);

      // Tenta buscar
      const { data: existingPlayer, error: selErr } = await supabase
        .from('players')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (selErr) throw selErr;
      if (existingPlayer) return existingPlayer as Player;

      // Cria novo
      const { data: newPlayer, error } = await supabase
        .from('players')
        .insert([{ email, name }])
        .select()
        .single();

      if (error) throw error;
      return newPlayer as Player;
    } catch (error) {
      console.error('Error saving player:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // NOVO: cria sessão vazia no login (para já registrar checkpoints)
  const createSession = async (playerId: string): Promise<GameSession | null> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('game_sessions')
        .insert([{
          player_id: playerId,
          score: 0,
          lives_used: 0,
          total_time: 0,
          completed_checkpoints: 0,
          accuracy_percentage: 0,
          delivery_efficiency: 0,
          customer_satisfaction: 0,
          is_completed: false
        }])
        .select()
        .single();

      if (error) throw error;
      return data as GameSession;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Mantido: insert de sessão completa (usado como fallback)
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
      return session as GameSession;
    } catch (error) {
      console.error('Error saving game session:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // NOVO: atualização da sessão aberta (para finalizar com KPIs/tempo/score)
  const updateGameSession = async (
    sessionId: string,
    gameData: Partial<Pick<GameSession,
      'score' | 'lives_used' | 'total_time' | 'completed_checkpoints' |
      'accuracy_percentage' | 'delivery_efficiency' | 'customer_satisfaction' |
      'is_completed'
    >>
  ): Promise<GameSession | null> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('game_sessions')
        .update(gameData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as GameSession;
    } catch (error) {
      console.error('Error updating game session:', error);
      return null;
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
      console.error('Error saving checkpoint progress:', error);
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
      return (data || []) as GameSession[];
    } catch (error) {
      console.error('Error fetching completed sessions:', error);
      return [];
    }
  };

  return {
    loading,
    savePlayer,
    createSession,          // <- novo
    updateGameSession,      // <- novo
    saveGameSession,
    saveCheckpointProgress,
    getCompletedSessions
  };
};
