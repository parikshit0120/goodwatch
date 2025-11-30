// Generate a unique session ID for tracking user preferences and watched movies
export const getOrCreateSessionId = (): string => {
  const SESSION_KEY = "goodwatch_session_id";

  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
};

// Profile management - using cookies
const PROFILE_KEY = "goodwatch_profile";

export interface UserProfile {
  age: string;
  gender: string;
  genres: string[];
  language: string;
}

const setCookie = (name: string, value: string, days: number = 365): void => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split("; " + name + "=");

  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(";").shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
};

export const saveProfile = (profile: UserProfile): void => {
  setCookie(PROFILE_KEY, JSON.stringify(profile));
};

export const getProfile = (): UserProfile | null => {
  const stored = getCookie(PROFILE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const hasProfile = (): boolean => {
  return !!getCookie(PROFILE_KEY);
};
