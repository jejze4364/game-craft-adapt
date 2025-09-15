import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

      // Busca jogador existente
      const { data: existingPlayer, error: fetchError } = await supabase
        .from('players')
        .select('*')
        .eq('email', playerCode)
        .maybeSingle();

      // Se vier um erro diferente de "no rows", propaga
      if (fetchError && (fetchError as any).code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingPlayer) {
        // Atualiza o nome se mudou
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

      // Cria novo jogador
      const { data: newPlayer, error } = await supabase
        .from('players')
        .insert([{ email: playerCode, name }])
        .select()
        .single();

      if (error) throw error;
      return mapPlayer(newPlayer);
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
      const { data, error } = await supabase
        .from('game_sessions')
        .update({
          ...gameData,
          completed_at: gameData.is_completed ? new Date().toISOString() : null
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as GameSession;
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
      const { data, error } = await supabase
        .from('game_sessions')
        .insert([{
          player_id: playerId,
          ...gameData,
          completed_at: gameData.is_completed ? new Date().toISOString() : null
        }])
        .select()
        .single();

      if (error) throw error;
      return data as GameSession;
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
      const { error } = await supabase
        .from('checkpoint_progress')
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

  // Busca sessões completas (para relatórios)
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
      
      return (data || []).map(session => ({
        ...session,
        players: session.players ? {
          email: session.players.email,
          name: session.players.name || undefined
        } : undefined
      })) as GameSession[];
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