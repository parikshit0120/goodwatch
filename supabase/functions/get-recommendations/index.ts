import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getMoodTags(mood: string): string[] {
  const lowerMood = mood.toLowerCase();
  const tags: string[] = [];
  
  if (lowerMood.match(/cry|sad|emotional|heartbreak|tear/)) tags.push('emotional', 'cry');
  if (lowerMood.match(/happy|fun|laugh|joy/)) tags.push('happy', 'fun');
  if (lowerMood.match(/date|romantic|romance|love/)) tags.push('romantic', 'date');
  if (lowerMood.match(/thrill|intense|suspense|mystery/)) tags.push('intense', 'thrill');
  if (lowerMood.match(/scary|horror|frightening/)) tags.push('scary');
  if (lowerMood.match(/action|adrenaline|fight|battle/)) tags.push('action');
  if (lowerMood.match(/think|deep|philosophical|intellectual/)) tags.push('thoughtful', 'deep');
  if (lowerMood.match(/relax|light|easy|tired/)) tags.push('relaxing', 'light');
  if (lowerMood.match(/family|kids|children/)) tags.push('family');
  
  return tags;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { language, era, mood } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const langMap: any = {
      'English': 'en', 'Hindi': 'hi', 'Tamil': 'ta',
      'Telugu': 'te', 'Malayalam': 'ml', 'Kannada': 'kn',
      'Bengali': 'bn', 'Marathi': 'mr'
    };

    let startDate = '', endDate = '';
    
    switch(era) {
      case 'Classic (pre-1980)':
        startDate = '1900-01-01'; endDate = '1979-12-31'; break;
      case '80s & 90s':
        startDate = '1980-01-01'; endDate = '1999-12-31'; break;
      case '2000s':
        startDate = '2000-01-01'; endDate = '2009-12-31'; break;
      case '2010s':
        startDate = '2010-01-01'; endDate = '2019-12-31'; break;
      case 'Recent (2020+)':
        startDate = '2020-01-01'; endDate = '2025-12-31'; break;
    }

    const moodTags = getMoodTags(mood || '');
    
    console.log('Filtering:', { language: langMap[language], era, moodTags });

    let query = supabase
      .from('movies')
      .select('*')
      .eq('original_language', langMap[language] || 'en')
      .gte('release_date', startDate)
      .lte('release_date', endDate);
    
    // CRITICAL: Filter by mood tags
    if (moodTags.length > 0) {
      query = query.overlaps('mood_tags', moodTags);
    }
    
    query = query.order('popularity', { ascending: false }).limit(20);

    const { data, error } = await query;

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} movies matching mood tags`);

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ movies: [], message: 'No movies found. Try different filters or wait for more movies to be enriched.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const movies = data.slice(0, 6).map((m: any) => ({
      title: m.title,
      year: new Date(m.release_date).getFullYear(),
      language: language,
      why: m.overview ? `${m.overview.substring(0, 150)}...` : 'A great movie!',
      where_to_watch: "Check streaming platforms",
      runtime: "~2h",
      genres: [],
      director: "Various",
      poster_path: m.poster_path
    }));

    return new Response(
      JSON.stringify({ movies }),
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
