-- Fix security issues identified in scan

-- 1. Fix watched_movies table: Remove overly permissive SELECT policy
-- Current policy allows anyone to read all watched movies (USING: true)
-- This violates user privacy
DROP POLICY IF EXISTS "Anyone can view watched movies" ON watched_movies;

-- Keep the INSERT policy as-is for adding watched movies
-- The edge functions use service role key for server-side reads

-- 2. Fix feedback table: Add explicit restrictive SELECT policy
-- Make it clear that feedback is write-only from the client side
CREATE POLICY "Feedback is write-only from client"
ON feedback FOR SELECT
USING (false);

-- This ensures feedback data cannot be read from the client
-- Server-side functions with service role key can still access it