import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Film, Zap, Globe, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { hasProfile, saveProfile } from "@/lib/sessionUtils";
import { ProfileModal } from "@/components/ProfileModal";

const Index = () => {
  const navigate = useNavigate();

  // Check immediately during render - synchronous
  const checkHasProfile = () => {
    const result = hasProfile();
    console.log("Cookie check - hasProfile:", result);
    console.log("All cookies:", document.cookie);
    return result;
  };

  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const hasUser = checkHasProfile();
    if (!hasUser) {
      setShowProfileModal(true);
    }
  }, []);

  const handleProfileComplete = (age: string, gender: string, genres: string[]) => {
    saveProfile({ age, gender, genres, language: "English" });
    setShowProfileModal(false);
  };

  return (
    <>
      <ProfileModal open={showProfileModal} onComplete={handleProfileComplete} />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden gradient-hero border-b border-border/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

          <div className="container mx-auto px-4 py-20 md:py-32 relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              {/* Logo */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <Film className="w-12 h-12 text-primary" />
                <h1 className="text-4xl md:text-5xl font-bold glow-text">GoodWatch</h1>
              </div>

              {/* Tagline */}
              <p className="text-sm md:text-base text-primary font-medium tracking-wide uppercase">
                The right movie for right now
              </p>

              {/* Main Headline */}
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-balance leading-tight">
                Stop scrolling. Start watching.
              </h2>

              {/* Subheadline */}
              <p className="text-xl md:text-2xl text-muted-foreground text-balance max-w-3xl mx-auto">
                Tell us your mood. Get 3 perfect movie picks in 30 seconds. No more Netflix paralysis.
              </p>

              {/* CTA */}
              <div className="pt-4 space-y-4">
                <Button
                  onClick={() => navigate("/finder")}
                  size="lg"
                  className="text-lg h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all hover:shadow-[0_0_30px_hsl(var(--gold)/0.3)] hover:scale-105"
                >
                  Find My Movie →
                </Button>
                <p className="text-sm text-muted-foreground">No signup required. Free to use.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-32 border-b border-border/50">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold text-center mb-16">How It Works</h3>

              <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                {/* Step 1 */}
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="text-xl font-semibold">Tell us your vibe</h4>
                  <p className="text-muted-foreground">
                    Exhausted after work? Date night? Can't sleep? Just tell us how you're feeling.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="text-xl font-semibold">AI finds your match</h4>
                  <p className="text-muted-foreground">
                    Our AI understands mood, not just genres. It picks movies that actually fit your moment.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                    <Globe className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="text-xl font-semibold">Watch with confidence</h4>
                  <p className="text-muted-foreground">
                    Get 3 recommendations with exactly where to stream them in India.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why GoodWatch Section */}
        <section className="py-20 md:py-32 border-b border-border/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold text-center mb-16">Why GoodWatch?</h3>

              <div className="space-y-8">
                <div className="bg-card border border-border/50 rounded-xl p-6 md:p-8 hover:border-primary/30 transition-all">
                  <h4 className="text-xl font-semibold mb-3">Actually helps you decide</h4>
                  <p className="text-muted-foreground">
                    Unlike IMDB that drowns you in data, we give you exactly 3 picks that match your current state of
                    mind.
                  </p>
                </div>

                <div className="bg-card border border-border/50 rounded-xl p-6 md:p-8 hover:border-primary/30 transition-all">
                  <h4 className="text-xl font-semibold mb-3">Knows Indian OTTs</h4>
                  <p className="text-muted-foreground">
                    Netflix, Prime Video, Disney+ Hotstar, JioCinema, Zee5, SonyLiv — we tell you exactly where to
                    watch.
                  </p>
                </div>

                <div className="bg-card border border-border/50 rounded-xl p-6 md:p-8 hover:border-primary/30 transition-all">
                  <h4 className="text-xl font-semibold mb-3">Understands mood, not just genre</h4>
                  <p className="text-muted-foreground">
                    Because "tired" isn't a genre on Netflix. We get the nuance of how you're feeling right now.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <p className="text-muted-foreground italic">Built for people who love movies but hate deciding</p>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <a href="mailto:hello@goodwatch.movie" className="hover:text-primary transition-colors">
                  Contact: hello@goodwatch.movie
                </a>
                <span>•</span>
                <span>Made in India 🇮🇳</span>
              </div>

              <div className="flex items-center justify-center gap-2 pt-4">
                <Film className="w-5 h-5 text-primary" />
                <span className="font-bold text-lg glow-text">GoodWatch</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
