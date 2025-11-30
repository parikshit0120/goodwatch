import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Film, ThumbsUp, ThumbsDown, ArrowRight, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MovieCard, { Movie } from "@/components/MovieCard";
import { getOrCreateSessionId } from "@/lib/sessionUtils";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [displayedMovies, setDisplayedMovies] = useState<Movie[]>([]);
  const [alternativeMovies, setAlternativeMovies] = useState<Movie[]>([]);
  const [mood, setMood] = useState("");
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [feedbackReasons, setFeedbackReasons] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFetchingReplacement, setIsFetchingReplacement] = useState(false);

  useEffect(() => {
    if (!location.state?.movies) {
      navigate('/finder');
      return;
    }
    
    const allMovies = location.state.movies;
    setDisplayedMovies(allMovies.slice(0, 3));
    setAlternativeMovies(allMovies.slice(3));
    setMood(location.state.mood);
  }, [location, navigate]);

  const topUpPool = async () => {
    if (alternativeMovies.length >= 2 || isFetchingReplacement) return;

    const neededCount = 6 - alternativeMovies.length;
    const watchedTitles = displayedMovies.map(m => m.title);
    const sessionId = getOrCreateSessionId();
    
    try {
      const { data } = await supabase.functions.invoke('get-replacement', {
        body: {
          session_id: sessionId,
          mood,
          preferred_language: location.state?.language,
          genres: location.state?.genres,
          watched_titles: watchedTitles,
          exclude_ids: [],
          count: neededCount,
        }
      });

      if (data?.replacements?.length) {
        setAlternativeMovies(prev => [...prev, ...data.replacements]);
      }
    } catch (error) {
      console.error('Error topping up pool:', error);
    }
  };

  const handleFeedback = async (isPositive: boolean) => {
    setFeedback(isPositive);
    
    if (isPositive) {
      // Save positive feedback immediately
      await saveFeedback(isPositive, null);
      toast.success("Thanks! Glad we could help.");
    }
  };

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true);
    const combinedFeedback = feedbackReasons.length > 0 
      ? `${feedbackReasons.join(", ")}${feedbackText.trim() ? `: ${feedbackText.trim()}` : ""}`
      : feedbackText.trim();
    await saveFeedback(false, combinedFeedback);
    setIsSubmitting(false);
    toast.success("Thanks! Your feedback helps us get better.");
    setFeedbackText("");
    setFeedbackReasons([]);
  };

  const toggleFeedbackReason = (reason: string) => {
    setFeedbackReasons(prev => 
      prev.includes(reason) 
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const saveFeedback = async (wasHelpful: boolean, feedbackNote: string | null) => {
    try {
      const { error } = await supabase.from('feedback').insert({
        user_mood: mood,
        was_helpful: wasHelpful,
        feedback_text: feedbackNote,
        recommendations: displayedMovies as any,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleAlreadyWatched = async (movie: Movie, index: number) => {
    const sessionId = getOrCreateSessionId();
    
    // Optimistically replace if pool available
    if (alternativeMovies.length > 0) {
      const replacement = alternativeMovies[0];
      const newDisplayed = [...displayedMovies];
      newDisplayed[index] = replacement;
      
      setDisplayedMovies(newDisplayed);
      setAlternativeMovies(alternativeMovies.slice(1));
      toast.success(`Showing ${replacement.title} instead`);
      
      // Persist watched (non-blocking)
      supabase.from('watched_movies').insert({
        session_id: sessionId,
        movie_title: movie.title,
        movie_year: movie.year
      }).then(() => {
        // Top up pool in background
        topUpPool();
      });
      
      return;
    }

    // No pool items - fetch synchronously
    setIsFetchingReplacement(true);
    const watchedTitles = displayedMovies.map(m => m.title);
    
    try {
      const { data } = await supabase.functions.invoke('get-replacement', {
        body: {
          session_id: sessionId,
          mood,
          preferred_language: location.state?.language,
          genres: location.state?.genres,
          watched_titles: watchedTitles,
          exclude_ids: [],
          count: 1,
        }
      });

      if (data?.replacements?.length) {
        const newDisplayed = [...displayedMovies];
        newDisplayed[index] = data.replacements[0];
        setDisplayedMovies(newDisplayed);
        toast.success(`Showing ${data.replacements[0].title} instead`);
      } else {
        toast.info("No more alternatives available");
      }

      // Persist watched
      await supabase.from('watched_movies').insert({
        session_id: sessionId,
        movie_title: movie.title,
        movie_year: movie.year
      });

    } catch (error) {
      console.error('Error fetching replacement:', error);
      toast.error("Failed to get replacement");
    } finally {
      setIsFetchingReplacement(false);
    }
  };

  if (!displayedMovies.length) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10 bg-background/95">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-xl font-bold">
            <Film className="w-6 h-6 text-primary" />
            <span className="glow-text">GoodWatch</span>
          </a>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/finder')}
            className="hover:text-primary"
          >
            New search
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="space-y-8">
          {/* Mood Display */}
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Based on your mood:</p>
            <p className="text-lg italic text-foreground/80">"{mood}"</p>
          </div>

          {/* Movie Cards */}
          <div className="grid gap-6 md:gap-8">
            {displayedMovies.map((movie, index) => (
              <MovieCard 
                key={index} 
                movie={movie} 
                onAlreadyWatched={() => handleAlreadyWatched(movie, index)}
              />
            ))}
          </div>

          {/* Feedback Section */}
          <div className="bg-card border border-border/50 rounded-xl p-6 md:p-8 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Did we nail it?</h3>
              
              {feedback === null ? (
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleFeedback(true)}
                    variant="secondary"
                    className="flex-1 h-auto py-4 hover:border-primary/50"
                  >
                    <ThumbsUp className="mr-2 h-5 w-5" />
                    Yes, perfect!
                  </Button>
                  <Button
                    onClick={() => handleFeedback(false)}
                    variant="secondary"
                    className="flex-1 h-auto py-4 hover:border-primary/50"
                  >
                    <ThumbsDown className="mr-2 h-5 w-5" />
                    Not quite
                  </Button>
                </div>
              ) : feedback === false ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <p className="text-sm text-muted-foreground">What went wrong?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Already seen it", "Wrong mood/vibe", "Too long", "Not on my platform", "Wrong language", "Too old/new"].map((reason) => (
                      <Button
                        key={reason}
                        type="button"
                        variant={feedbackReasons.includes(reason) ? "default" : "secondary"}
                        size="sm"
                        onClick={() => toggleFeedbackReason(reason)}
                        className="text-xs"
                      >
                        {reason}
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Anything else? (optional)"
                    className="min-h-[80px] bg-secondary/50"
                  />
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={feedbackReasons.length === 0 && !feedbackText.trim() || isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Send feedback
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground animate-in fade-in duration-300">
                  ✨ Thanks! Your feedback helps us get better.
                </p>
              )}
            </div>
          </div>

          {/* Try Again Section */}
          <div className="bg-card border border-border/50 rounded-xl p-6 md:p-8 text-center space-y-4">
            <h3 className="text-xl font-semibold">Want different recommendations?</h3>
            <Button
              onClick={() => navigate('/finder')}
              variant="secondary"
              size="lg"
              className="hover:border-primary/50"
            >
              Try a different mood
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Share Section */}
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">Found something good?</p>
            <Button
              onClick={copyLink}
              variant="ghost"
              className="hover:text-primary"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Link copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy link to share
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Results;
