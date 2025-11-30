import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const tmdbApiKey = Deno.env.get('TMDB_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, mood, preferred_language, genres, watched_titles = [], exclude_ids = [], count = 1 } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch watched movies for this session
    const { data: watchedMovies } = await supabaseClient
      .from('watched_movies')
      .select('movie_title')
      .eq('session_id', session_id);

    const allWatchedTitles = [...watched_titles, ...(watchedMovies?.map(m => m.movie_title) || [])];
    
    const genreContext = genres?.length ? `Their favorite genres are: ${genres.join(', ')}.` : '';
    const languageContext = preferred_language ? `Primary language preference: ${preferred_language}.` : 'Language: English';
    const watchedContext = allWatchedTitles.length > 0 
      ? `EXCLUDE these already watched movies: ${allWatchedTitles.join(', ')}.` 
      : '';

    const systemPrompt = `You are an expert movie curator. Provide exactly ${count} replacement movie recommendations.
${genreContext} ${languageContext}
${watchedContext}
Return a JSON array with fields: title, year, why, where_to_watch (Netflix India/Prime Video/Disney+ Hotstar/JioCinema/Zee5/SonyLiv/Theaters), runtime, genres, language.
If ${preferred_language} movies unavailable, use English and add "language_fallback": true.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Current mood: ${mood}. Suggest ${count} replacement movies.` }
          ],
          temperature: 0.8,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('OpenAI API error:', response.status, await response.text());
        return new Response(JSON.stringify({ replacements: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      let replacements = JSON.parse(data.choices[0].message.content);

      if (!Array.isArray(replacements)) {
        replacements = [replacements];
      }

      // Enhance with TMDB posters
      const enhancedReplacements = await Promise.all(replacements.map(async (movie: any) => {
        try {
          const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(movie.title)}&year=${movie.year}`;
          const tmdbResponse = await fetch(searchUrl);
          const tmdbData = await tmdbResponse.json();
          
          if (tmdbData.results && tmdbData.results.length > 0) {
            return { ...movie, poster_path: tmdbData.results[0].poster_path };
          }
        } catch (error) {
          console.error('TMDB fetch error:', error);
        }
        return movie;
      }));

      return new Response(JSON.stringify({ replacements: enhancedReplacements }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.log('Request timeout after 3s');
        return new Response(JSON.stringify({ replacements: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error in get-replacement:', error);
    return new Response(JSON.stringify({ replacements: [], error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
