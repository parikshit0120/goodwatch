import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractMoodTags(overview: string, keywords: any[]): string[] {
  const moodTags: Set<string> = new Set();
  const text = (overview + ' ' + keywords.map(k => k.name).join(' ')).toLowerCase();
  
  if (text.match(/tragedy|tear|emotional|heartbreak|loss|grief|sad|touching|moving/)) {
    moodTags.add('emotional'); moodTags.add('cry');
  }
  if (text.match(/comedy|funny|hilarious|laugh|humor|feel-good|uplifting|joy/)) {
    moodTags.add('happy'); moodTags.add('fun');
  }
  if (text.match(/romance|love|relationship|couple|date|romantic/)) {
    moodTags.add('romantic'); moodTags.add('date');
  }
  if (text.match(/thriller|suspense|mystery|intense|gripping|tension|edge/)) {
    moodTags.add('intense'); moodTags.add('thrill');
  }
  if (text.match(/horror|scary|terrifying|frightening|creepy|nightmare/)) {
    moodTags.add('scary');
  }
  if (text.match(/action|adventure|explosive|fight|battle|war|chase/)) {
    moodTags.add('action'); moodTags.add('adrenaline');
  }
  if (text.match(/philosophical|thought-provoking|intellectual|complex|deep|meaning/)) {
    moodTags.add('thoughtful'); moodTags.add('deep');
  }
  if (text.match(/light|easy|casual|relaxing|comfortable|gentle/)) {
    moodTags.add('relaxing'); moodTags.add('light');
  }
  if (text.match(/family|children|kids|wholesome|innocent/)) {
    moodTags.add('family');
  }
  
  return Array.from(moodTags);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { limit = 100, offset = 0 } = await req.json();
    
    const { data: movies } = await supabase
      .from('movies')
      .select('id, overview')
      .is('mood_tags', null)
      .range(offset, offset + limit - 1);
    
    if (!movies || movies.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No movies to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    let processed = 0;
    
    for (const movie of movies) {
      try {
        const keywordRes = await fetch(
          `https://api.themoviedb.org/3/movie/${movie.id}/keywords?api_key=${TMDB_API_KEY}`
        );
        
        if (keywordRes.ok) {
          const keywordData = await keywordRes.json();
          const keywords = keywordData.keywords || [];
          const keywordNames = keywords.map((k: any) => k.name);
          const moodTags = extractMoodTags(movie.overview || '', keywords);
          
          await supabase
            .from('movies')
            .update({ keywords: keywordNames, mood_tags: moodTags })
            .eq('id', movie.id);
          
          processed++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing movie ${movie.id}:`, error);
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, processed, total: movies.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
