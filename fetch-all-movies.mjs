import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const TMDB_API_KEY = '204363c10c39f75a0320ad4258565f71';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllMovies() {
  const allMovies = [];
  
  console.log('🎬 Starting to fetch movies from TMDB using curl...\n');
  
  for (let page = 1; page <= 500; page++) {
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&page=${page}&sort_by=popularity.desc`;
    
    try {
      const { stdout } = await execAsync(`curl -s "${url}"`);
      const data = JSON.parse(stdout);
      
      if (data.results && data.results.length > 0) {
        allMovies.push(...data.results);
        console.log(`✓ Page ${page}/500 - Total: ${allMovies.length} movies`);
      } else {
        console.log(`✗ No more results at page ${page}`);
        break;
      }
      
      await delay(250);
    } catch (error) {
      console.error(`Error on page ${page}:`, error.message);
      break;
    }
  }
  
  fs.writeFileSync('all-movies.json', JSON.stringify(allMovies, null, 2));
  console.log(`\n✅ Saved ${allMovies.length} movies to all-movies.json`);
  console.log(`📊 File size: ${(fs.statSync('all-movies.json').size / 1024 / 1024).toFixed(2)} MB`);
}

fetchAllMovies().catch(console.error);
