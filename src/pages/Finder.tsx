import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Film, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getProfile, getOrCreateSessionId } from "@/lib/sessionUtils";

const QUICK_MOODS = [
  "Tired, need comfort",
  "Date night",
  "Can't sleep",
  "Want to cry",
  "Need a thrill",
  "Lazy Sunday",
];

const Finder = () => {
  const [mood, setMood] = useState("");
  const [language, setLanguage] = useState("");
  const [era, setEra] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!language) {
      toast.error("Please select a language");
      return;
    }

    if (!era) {
      toast.error("Please select an era");
      return;
    }

    if (!mood.trim() || mood.trim().length < 3) {
      toast.error("Please describe how you're feeling (at least 3 characters)");
      return;
    }

    setIsLoading(true);

    try {
      const profile = getProfile();
      const sessionId = getOrCreateSessionId();
      
      const { data, error } = await supabase.functions.invoke('get-recommendations', {
        body: { 
          mood: mood.trim(),
          age: profile?.age,
          gender: profile?.gender,
          genres: profile?.genres,
          language,
          era,
          sessionId
        }
      });

      if (error) throw error;

      if (data?.movies) {
        navigate('/results', { state: { 
          movies: data.movies, 
          mood: mood.trim(),
          language: profile?.language,
          genres: profile?.genres
        } });
      } else {
        throw new Error('No recommendations received');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast.error("Failed to get recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-xl font-bold">
            <Film className="w-6 h-6 text-primary" />
            <span className="glow-text">GoodWatch</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12 md:py-20 max-w-3xl">
        <div className="space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              How are you feeling right now?
            </h1>
            <p className="text-muted-foreground text-lg">
              Be specific! The more you tell us, the better your picks.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dynamic Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">What language today?</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-10 px-3 rounded-md bg-card border border-border/50 text-foreground focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">Select language</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Marathi">Marathi</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">What era are you feeling?</label>
                <select
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-10 px-3 rounded-md bg-card border border-border/50 text-foreground focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">Select era</option>
                  <option value="Classic (pre-1980)">Classic (pre-1980)</option>
                  <option value="80s & 90s">80s & 90s</option>
                  <option value="2000s">2000s</option>
                  <option value="2010s">2010s</option>
                  <option value="Recent (2020+)">Recent (2020+)</option>
                </select>
              </div>
            </div>

            {!language || !era ? (
              <p className="text-sm text-muted-foreground text-center">
                Select language and era to continue
              </p>
            ) : null}

            <div className="space-y-3">
              <Textarea
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="e.g., Exhausted after a long day, need something light and funny"
                className="min-h-[120px] text-lg resize-none bg-card border-border/50 focus:border-primary transition-colors"
                disabled={isLoading}
              />
            </div>

            {/* Quick Mood Buttons */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Or choose a quick mood:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_MOODS.map((quickMood) => (
                  <Button
                    key={quickMood}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setMood(quickMood)}
                    disabled={isLoading}
                    className="hover:border-primary/50 transition-all"
                  >
                    {quickMood}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full text-lg h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all hover:shadow-[0_0_30px_hsl(var(--gold)/0.3)]"
              disabled={isLoading || !mood.trim() || mood.trim().length < 3 || !language || !era}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Finding your perfect picks...
                </>
              ) : (
                <>
                  Find My Movies →
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Finder;
