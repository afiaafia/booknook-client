export const READING_LIST_KEY = 'booknook-reading-list';
export const EMPTY_READING_LIST: readonly string[] = [];

let cachedReadingList: readonly string[] = EMPTY_READING_LIST;
let cachedReadingListRaw: string | null | undefined;

export function getSavedBookIds(): readonly string[] {
  if (typeof window === 'undefined') return EMPTY_READING_LIST;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(READING_LIST_KEY);
  } catch {
    raw = null;
  }

  if (raw === cachedReadingListRaw) return cachedReadingList;

  cachedReadingListRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedReadingList = Array.isArray(parsed)
      ? [
          ...new Set(
            parsed.filter((id): id is string => typeof id === 'string')
          ),
        ]
      : EMPTY_READING_LIST;
  } catch {
    cachedReadingList = EMPTY_READING_LIST;
  }

  return cachedReadingList;
}

export function subscribeToSavedBookIds(onChange: () => void) {
  if (typeof window === 'undefined') return () => undefined;

  window.addEventListener('storage', onChange);
  window.addEventListener('booknook-reading-list', onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener('booknook-reading-list', onChange);
  };
}

export function setSavedBookIds(ids: readonly string[]) {
  const uniqueIds = [...new Set(ids)];
  const serialized = JSON.stringify(uniqueIds);
  cachedReadingList = uniqueIds;
  cachedReadingListRaw = serialized;

  try {
    window.localStorage.setItem(READING_LIST_KEY, serialized);
  } catch {
    cachedReadingListRaw = undefined;
  }

  window.dispatchEvent(new Event('booknook-reading-list'));
}

export function toggleSavedBook(id: string) {
  const current = getSavedBookIds();
  setSavedBookIds(
    current.includes(id)
      ? current.filter((savedId) => savedId !== id)
      : [...current, id]
  );
}
