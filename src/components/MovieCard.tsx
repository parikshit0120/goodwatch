import { Film } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Movie {
  title: string;
  year: number;
  why: string;
  where_to_watch: string;
  runtime: string;
  genres: string[];
  language: string;
  poster_path?: string | null;
}

interface MovieCardProps {
  movie: Movie;
  onAlreadyWatched?: () => void;
}

const MovieCard = ({ movie, onAlreadyWatched }: MovieCardProps) => {
  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--gold)/0.1)]">
      <div className="flex flex-col md:flex-row">
        {/* Movie Poster */}
        <div className="w-full md:w-48 h-64 md:h-auto bg-secondary/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {movie.poster_path ? (
            <img 
              src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
              alt={`${movie.title} poster`}
              className="w-full h-full object-cover"
            />
          ) : (
            <Film className="w-16 h-16 text-muted-foreground/50" />
          )}
        </div>

        {/* Movie Info */}
        <div className="flex-1 p-6 space-y-4">
          {/* Title & Year */}
          <div className="space-y-1">
            <h3 className="text-2xl font-bold">
              {movie.title} <span className="text-muted-foreground">({movie.year})</span>
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{movie.runtime}</span>
              <span>•</span>
              <span>{movie.language}</span>
            </div>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 bg-secondary/50 text-xs rounded-full border border-border/30"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Why This Fits */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-primary">Why this fits your mood</h4>
            <p className="text-foreground/90 leading-relaxed">{movie.why}</p>
          </div>

          {/* Where to Watch */}
          <div className="pt-4 border-t border-border/30 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Where to watch:</span>
              <span className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-lg border border-primary/20">
                {movie.where_to_watch}
              </span>
            </div>

            {onAlreadyWatched && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAlreadyWatched}
                className="w-full hover:bg-secondary"
              >
                Already Watched
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
