export interface ReadingPreferences {
  bio: string;
  motto: string;
  interests: string[];
  favoriteGenres: string[];
  favoriteAuthors: string[];
}

export const EMPTY_READING_PREFERENCES: ReadingPreferences = {
  bio: '',
  motto: '',
  interests: [],
  favoriteGenres: [],
  favoriteAuthors: [],
};

const snapshots = new Map<
  string,
  { raw: string | null | undefined; value: ReadingPreferences }
>();

function preferencesKey(userId: string): string {
  return `booknook-reading-preferences:${userId}`;
}

function normalizeTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ].slice(0, 20);
}

export function getReadingPreferences(userId: string): ReadingPreferences {
  if (typeof window === 'undefined') return EMPTY_READING_PREFERENCES;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(preferencesKey(userId));
  } catch {
    raw = null;
  }

  const cached = snapshots.get(userId);
  if (cached?.raw === raw) return cached.value;

  let value = EMPTY_READING_PREFERENCES;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (typeof parsed === 'object' && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      value = {
        bio: typeof record.bio === 'string' ? record.bio.slice(0, 320) : '',
        motto:
          typeof record.motto === 'string' ? record.motto.slice(0, 120) : '',
        interests: normalizeTextList(record.interests),
        favoriteGenres: normalizeTextList(record.favoriteGenres),
        favoriteAuthors: normalizeTextList(record.favoriteAuthors),
      };
    }
  } catch {
    value = EMPTY_READING_PREFERENCES;
  }

  snapshots.set(userId, { raw, value });
  return value;
}

export function subscribeToReadingPreferences(
  userId: string,
  onChange: () => void
) {
  if (typeof window === 'undefined') return () => undefined;

  const eventName = `booknook-reading-preferences:${userId}`;
  window.addEventListener('storage', onChange);
  window.addEventListener(eventName, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(eventName, onChange);
  };
}

export function saveReadingPreferences(
  userId: string,
  preferences: ReadingPreferences
) {
  const value: ReadingPreferences = {
    bio: preferences.bio.slice(0, 320),
    motto: preferences.motto.slice(0, 120),
    interests: normalizeTextList(preferences.interests),
    favoriteGenres: normalizeTextList(preferences.favoriteGenres),
    favoriteAuthors: normalizeTextList(preferences.favoriteAuthors),
  };
  const raw = JSON.stringify(value);
  snapshots.set(userId, { raw, value });

  try {
    window.localStorage.setItem(preferencesKey(userId), raw);
  } catch {
    snapshots.set(userId, { raw: undefined, value });
  }

  window.dispatchEvent(new Event(`booknook-reading-preferences:${userId}`));
}
