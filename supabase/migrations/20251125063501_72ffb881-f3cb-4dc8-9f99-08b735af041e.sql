-- Create watched_movies table to track what users have already seen
CREATE TABLE public.watched_movies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  movie_title TEXT NOT NULL,
  movie_year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.watched_movies ENABLE ROW LEVEL SECURITY;

-- Create policies for watched movies
CREATE POLICY "Anyone can insert watched movies" 
ON public.watched_movies 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view watched movies" 
ON public.watched_movies 
FOR SELECT 
USING (true);

-- Create index for better query performance
CREATE INDEX idx_watched_movies_session_id ON public.watched_movies(session_id);