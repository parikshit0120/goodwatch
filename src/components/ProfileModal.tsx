import { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ProfileModalProps {
  open: boolean;
  onComplete: (age: string, gender: string, genres: string[]) => void;
}

const AGE_BRACKETS = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55+"];
const GENDERS = ["male", "female", "non-binary", "prefer-not-to-say"];
const AVAILABLE_GENRES = [
  "Action", "Comedy", "Drama", "Romance", "Thriller", "Horror",
  "Sci-Fi", "Fantasy", "Mystery", "Documentary", "Animation", "Musical",
  "Crime", "Adventure", "Family", "War", "Biography", "Western"
];

export const ProfileModal = ({ open, onComplete }: ProfileModalProps) => {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [genre1, setGenre1] = useState("");
  const [genre2, setGenre2] = useState("");
  const [genre3, setGenre3] = useState("");
  
  // Debug logging
  console.log("ProfileModal render - open:", open);

  const handleSubmit = () => {
    if (age && gender && genre1 && genre2 && genre3) {
      onComplete(age, gender, [genre1, genre2, genre3]);
    }
  };

  const selectedGenres = [genre1, genre2, genre3].filter(Boolean);
  
  const toggleGenre = (genre: string) => {
    if (!genre1) {
      setGenre1(genre);
    } else if (!genre2 && genre !== genre1) {
      setGenre2(genre);
    } else if (!genre3 && genre !== genre1 && genre !== genre2) {
      setGenre3(genre);
    } else if (genre === genre1) {
      setGenre1("");
    } else if (genre === genre2) {
      setGenre2("");
    } else if (genre === genre3) {
      setGenre3("");
    }
  };

  return (
    <Dialog open={open} modal>
      <DialogPortal>
        <DialogOverlay style={{ zIndex: 9998 }} />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg sm:rounded-lg"
          style={{ zIndex: 9999 }}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
        <DialogHeader>
          <DialogTitle>Welcome to GoodWatch</DialogTitle>
          <DialogDescription>
            Help us personalize your movie recommendations
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            <Label>Age Bracket</Label>
            <div className="grid grid-cols-3 gap-2">
              {AGE_BRACKETS.map((bracket) => (
                <Button
                  key={bracket}
                  type="button"
                  variant={age === bracket ? "default" : "outline"}
                  onClick={() => setAge(bracket)}
                  className={cn(
                    "h-10 text-sm",
                    age === bracket && "bg-primary text-primary-foreground"
                  )}
                >
                  {bracket}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Gender</Label>
            <div className="grid grid-cols-2 gap-2">
              {GENDERS.map((g) => (
                <Button
                  key={g}
                  type="button"
                  variant={gender === g ? "default" : "outline"}
                  onClick={() => setGender(g)}
                  className={cn(
                    "h-10 text-sm capitalize",
                    gender === g && "bg-primary text-primary-foreground"
                  )}
                >
                  {g === "prefer-not-to-say" ? "Prefer not to say" : g}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <Label>Favorite Genres (pick 3)</Label>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_GENRES.map((genre) => (
                <Button
                  key={genre}
                  type="button"
                  variant={selectedGenres.includes(genre) ? "default" : "outline"}
                  onClick={() => toggleGenre(genre)}
                  disabled={selectedGenres.length >= 3 && !selectedGenres.includes(genre)}
                  className={cn(
                    "h-10 text-xs",
                    selectedGenres.includes(genre) && "bg-primary text-primary-foreground"
                  )}
                >
                  {genre}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={!age || !gender || !genre1 || !genre2 || !genre3} className="w-full">
          Continue
        </Button>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
