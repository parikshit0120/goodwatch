import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const TMDB_API_KEY = '204363c10c39f75a0320ad4258565f71';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { pages = 10, endpoint = 'popular' } = await req.json();
    
    let inserted = 0;
    
    for (let page = 1; page <= pages; page++) {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${TMDB_API_KEY}&page=${page}`
      );
      const json = await res.json();
      
      for (const m of json.results || []) {
        // Fetch full movie details including credits and keywords
        const detailRes = await fetch(
          `https://api.themoviedb.org/3/movie/${m.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,keywords,watch/providers`
        );
        const details = await detailRes.json();
        
        const releaseYear = m.release_date ? new Date(m.release_date).getFullYear() : null;
        const decade = releaseYear ? `${Math.floor(releaseYear / 10) * 10}s` : null;
        let era = null;
        if (releaseYear) {
          if (releaseYear < 1980) era = 'Classic (pre-1980)';
          else if (releaseYear < 2000) era = '80s & 90s';
          else if (releaseYear < 2010) era = '2000s';
          else if (releaseYear < 2020) era = '2010s';
          else era = 'Recent (2020+)';
        }
        
        const { error } = await supabase.from('movies').upsert({
          tmdb_id: m.id,
          imdb_id: details.imdb_id,
          title: m.title,
          original_title: m.original_title,
          year: releaseYear,
          decade,
          era,
          release_date: m.release_date,
          language: m.original_language === 'en' ? 'English' : 
                   m.original_language === 'hi' ? 'Hindi' :
                   m.original_language === 'ta' ? 'Tamil' :
                   m.original_language === 'te' ? 'Telugu' :
                   m.original_language === 'ml' ? 'Malayalam' : 'Other',
          original_language: m.original_language,
          genres: details.genres?.map((g: any) => g.name) || [],
          genre_ids: m.genre_ids,
          overview: m.overview,
          tagline: details.tagline,
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          runtime: details.runtime,
          budget: details.budget,
          revenue: details.revenue,
          vote_average: m.vote_average,
          vote_count: m.vote_count,
          popularity: m.popularity,
          adult: m.adult,
          status: details.status,
          director: details.credits?.crew?.find((c: any) => c.job === 'Director')?.name,
          directors: details.credits?.crew?.filter((c: any) => c.job === 'Director').map((c: any) => c.name) || [],
          movie_cast: details.credits?.cast?.slice(0, 10).map((c: any) => c.name) || [],
          cast_ids: details.credits?.cast?.slice(0, 10).map((c: any) => c.id) || [],
          keywords: details.keywords?.keywords?.map((k: any) => k.name) || [],
          streaming_providers: details['watch/providers']?.results?.IN || null,
          collection_id: details.belongs_to_collection?.id,
          collection_name: details.belongs_to_collection?.name
        }, { onConflict: 'tmdb_id' });
        
        if (!error) inserted++;
        await new Promise(r => setTimeout(r, 250)); // Rate limit
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, inserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
