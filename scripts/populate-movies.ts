import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQ3NTAxMSwiZXhwIjoyMDgwMDUxMDExfQ._BhD3WndvvMkmeeoYIonUXrB9FOEX8VcWNIIhvUEJzM';
const TMDB_API_KEY = '204363c10c39f75a0320ad4258565f71';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fetchAndInsertMovies() {
  console.log('Starting to fetch movies from TMDB...');
  
  let insertedCount = 0;
  const targetCount = 10000;
  
  for (let page = 1; page <= 500 && insertedCount < targetCount; page++) {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&page=${page}&language=en-US`
      );
      
      if (!response.ok) {
        console.error(`Failed to fetch page ${page}:`, response.status);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      const data = await response.json();
      const movies = data.results;
      
      const moviesToInsert = movies.map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        original_title: movie.original_title,
        original_language: movie.original_language,
        adult: movie.adult,
        video: movie.video,
        popularity: movie.popularity,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        overview: movie.overview,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        genre_ids: movie.genre_ids
      }));
      
      const { error } = await supabase
        .from('movies')
        .upsert(moviesToInsert, { onConflict: 'id' });
      
      if (error) {
        console.error(`Error inserting page ${page}:`, error);
      } else {
        insertedCount += movies.length;
        console.log(`✓ Page ${page}: ${insertedCount}/${targetCount} movies`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 250));
      
    } catch (error) {
      console.error(`Error on page ${page}:`, error);
    }
  }
  
  console.log(`\n✓ Completed! Inserted ${insertedCount} movies`);
}

fetchAndInsertMovies();
