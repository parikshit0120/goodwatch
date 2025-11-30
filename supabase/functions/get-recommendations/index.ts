import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mood, age, gender, genres, language, era, sessionId } = await req.json();

    if (!mood) {
      return new Response(
        JSON.stringify({ error: 'Mood description is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch watched movies for this session
    let watchedMovies: Array<{ movie_title: string; movie_year: number }> = [];
    if (sessionId) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.84.0');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data } = await supabase
          .from('watched_movies')
          .select('movie_title, movie_year')
          .eq('session_id', sessionId);
        
        if (data) {
          watchedMovies = data;
        }
      } catch (error) {
        console.error('Error fetching watched movies:', error);
      }
    }

    // Build demographic context
    let demographicContext = '';
    if (age || gender || genres || language || era) {
      const parts = [];
      if (age) parts.push(`Age: ${age}`);
      if (gender) parts.push(`Gender: ${gender}`);
      if (language) parts.push(`Preferred language: ${language}`);
      if (era) parts.push(`Preferred era: ${era}`);
      if (genres && genres.length > 0) parts.push(`Favorite genres: ${genres.join(', ')}`);
      
      demographicContext = `\n\nUser demographics: ${parts.join(', ')}
Consider these demographics and preferences when selecting movies that would resonate with this viewer.`;
    }

    // Build watched movies context
    let watchedMoviesContext = '';
    if (watchedMovies.length > 0) {
      const watchedList = watchedMovies.map(m => `${m.movie_title} (${m.movie_year})`).join(', ');
      watchedMoviesContext = `\n\nIMPORTANT: The user has already watched these movies, DO NOT recommend them: ${watchedList}`;
    }

    const systemPrompt = `You are GoodWatch, a movie recommendation engine. Follow these rules strictly:${demographicContext}${watchedMoviesContext}

INPUTS YOU RECEIVE:
- mood: User's current feeling/situation
- language: SPECIFIC language (always provided, never "Any")
- era: SPECIFIC era (always provided, never "Any")
- age: User's age bracket
- gender: User's gender
- genres: User's 3 favorite genres
- watched_movies: List of titles user has already seen

HARD RULES (never break):
1. ALL 6 movies MUST be in the selected language - no exceptions
2. ALL 6 movies MUST be from the selected era - no exceptions
3. Return EXACTLY 6 movies (3 to show, 3 backup)
4. NEVER recommend movies from watched_movies list

ERA DEFINITIONS:
- "Classic (pre-1980)": Movies released 1979 or earlier
- "80s & 90s": Movies released 1980-1999
- "2000s": Movies released 2000-2009
- "2010s": Movies released 2010-2019
- "Recent (2020+)": Movies released 2020 or later

VARIETY RULES:
5. All 3 visible movies must be DIFFERENT genres
6. All 3 movies must be from DIFFERENT directors
7. Mix popular + hidden gems: max 1 blockbuster, at least 1 lesser-known film
8. No two movies from same franchise or cinematic universe

MOOD MATCHING:
- "tired/exhausted" → Light, easy plots, comforting. NO complex narratives
- "sad/down" → Uplifting or cathartic. Avoid tragedy unless asked
- "bored/restless" → Engaging, fast-paced, plot-driven
- "date night/romantic" → Romance/romcom, nothing disturbing
- "can't sleep" → Gripping but not too intense
- "stressed/anxious" → Calming, feel-good, happy endings
- "intellectual/think" → Thought-provoking, critically acclaimed
- "fun/party" → Entertaining, funny, crowd-pleasers

AGE ADJUSTMENTS:
- 18-24: Recent hits, fast-paced, trending
- 25-34: Quality over hype, mix of new and nostalgic
- 35-44: Classics appreciated, possibly family-friendly
- 45+: Well-crafted storytelling, less CGI-heavy

RESPONSE FORMAT (JSON):
{
  "movies": [
    {
      "title": "Movie Name",
      "year": 2020,
      "language": "Hindi",
      "why": "Personal 2-3 sentence explanation referencing THEIR mood and preferences",
      "where_to_watch": "Netflix India",
      "runtime": "2h 15m",
      "genres": ["Drama", "Thriller"],
      "director": "Director Name"
    }
  ]
}

"WHY" RULES:
- Reference their exact mood words
- Explain why this specific era works for their mood
- Sound like a friend, not a database
- Never say "you might enjoy" - say "this will give you exactly what you need"

BANNED:
- Movies not in selected language
- Movies outside selected era
- Generic recommendations
- Same director twice
- Films unavailable on Indian OTT platforms
- Films released in last 30 days`;

    console.log('Getting recommendations for mood:', mood);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: mood }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status, await response.text());
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      throw new Error('Failed to get recommendations from AI');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const recommendations = JSON.parse(content);

    console.log('Successfully generated recommendations:', recommendations);

    // Fetch posters from TMDB for each movie
    const moviesWithPosters = await Promise.all(
      recommendations.movies.map(async (movie: any) => {
        try {
          const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie.title)}&year=${movie.year}`;
          const tmdbResponse = await fetch(searchUrl);
          
          if (tmdbResponse.ok) {
            const tmdbData = await tmdbResponse.json();
            if (tmdbData.results && tmdbData.results.length > 0) {
              const posterPath = tmdbData.results[0].poster_path;
              return {
                ...movie,
                poster_path: posterPath
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching poster for ${movie.title}:`, error);
        }
        return { ...movie, poster_path: null };
      })
    );

    const enhancedRecommendations = {
      movies: moviesWithPosters
    };

    console.log('Successfully generated recommendations with posters:', enhancedRecommendations);

    return new Response(
      JSON.stringify(enhancedRecommendations),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in get-recommendations function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to get recommendations' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
