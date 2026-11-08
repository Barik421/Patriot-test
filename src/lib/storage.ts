export function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(`patriot:${key}`);
  } catch {
    return null;
  }
}
export function writeStorage(key: string, value: string | null): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (value === null) localStorage.removeItem(`patriot:${key}`);
    else localStorage.setItem(`patriot:${key}`, value);
    return true;
  } catch {
    return false;
  }
}
