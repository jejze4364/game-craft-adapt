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
  completed_at: string;
  is_completed: boolean;
  players?: {
    email: string;
    name?: string;
  };
}

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
      console.error('Error saving player:', error);
      return null;
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
      console.error('Error saving game session:', error);
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
      return data || [];
    } catch (error) {
      console.error('Error fetching completed sessions:', error);
      return [];
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
