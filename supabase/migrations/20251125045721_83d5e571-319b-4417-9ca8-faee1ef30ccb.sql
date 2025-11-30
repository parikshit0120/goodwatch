-- Create feedback table to store user feedback
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_mood TEXT NOT NULL,
  was_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  recommendations JSONB NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert feedback (public app, no auth required)
CREATE POLICY "Anyone can insert feedback" 
ON public.feedback 
FOR INSERT 
WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);