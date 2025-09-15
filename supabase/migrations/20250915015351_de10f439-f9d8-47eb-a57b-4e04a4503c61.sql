-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_sessions table
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  lives_used INTEGER NOT NULL DEFAULT 0,
  total_time INTEGER NOT NULL DEFAULT 0, -- in seconds
  completed_checkpoints INTEGER NOT NULL DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  delivery_efficiency DECIMAL(5,2) NOT NULL DEFAULT 0,
  customer_satisfaction DECIMAL(5,2) NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_completed BOOLEAN NOT NULL DEFAULT false
);

-- Create checkpoints_progress table
CREATE TABLE public.checkpoints_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  checkpoint_id INTEGER NOT NULL,
  answered_correctly BOOLEAN NOT NULL,
  time_taken INTEGER NOT NULL DEFAULT 0, -- in seconds
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for players table (public read, authenticated write)
CREATE POLICY "Anyone can view players" 
ON public.players 
FOR SELECT 
USING (true);

CREATE POLICY "Players can insert their own data" 
ON public.players 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Players can update their own data" 
ON public.players 
FOR UPDATE 
USING (true);

-- Create policies for game_sessions table
CREATE POLICY "Anyone can view completed game sessions" 
ON public.game_sessions 
FOR SELECT 
USING (is_completed = true);

CREATE POLICY "Anyone can insert game sessions" 
ON public.game_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update game sessions" 
ON public.game_sessions 
FOR UPDATE 
USING (true);

-- Create policies for checkpoints_progress table
CREATE POLICY "Anyone can view checkpoint progress for completed sessions" 
ON public.checkpoints_progress 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.game_sessions 
  WHERE id = session_id AND is_completed = true
));

CREATE POLICY "Anyone can insert checkpoint progress" 
ON public.checkpoints_progress 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_game_sessions_player_id ON public.game_sessions(player_id);
CREATE INDEX idx_game_sessions_completed_at ON public.game_sessions(completed_at);
CREATE INDEX idx_checkpoints_progress_session_id ON public.checkpoints_progress(session_id);
CREATE INDEX idx_players_email ON public.players(email);