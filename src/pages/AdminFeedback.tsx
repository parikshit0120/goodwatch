import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Film } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedbackEntry {
  id: string;
  created_at: string;
  user_mood: string;
  was_helpful: boolean;
  feedback_text: string | null;
  recommendations: any;
}

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-feedback');

      if (error) throw error;
      setFeedback(data?.feedback || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10 bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-xl font-bold">
            <Film className="w-6 h-6 text-primary" />
            <span className="glow-text">GoodWatch Admin</span>
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Feedback Dashboard</h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : feedback.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No feedback yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold">Date</th>
                  <th className="text-left p-4 font-semibold">User Mood</th>
                  <th className="text-left p-4 font-semibold">Helpful?</th>
                  <th className="text-left p-4 font-semibold">Feedback</th>
                  <th className="text-left p-4 font-semibold">Movies</th>
                </tr>
              </thead>
              <tbody>
                {feedback.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50 hover:bg-card/50">
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="line-clamp-2">{entry.user_mood}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm ${entry.was_helpful ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {entry.was_helpful ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="p-4 max-w-sm">
                      <div className="line-clamp-3 text-sm">
                        {entry.feedback_text || <span className="text-muted-foreground italic">No feedback</span>}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {Array.isArray(entry.recommendations) 
                        ? entry.recommendations.map((m: any) => m.title).join(', ')
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminFeedback;
