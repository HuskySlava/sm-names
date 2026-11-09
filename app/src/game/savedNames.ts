// "Your names": up to MAX_SAVED winners, kept by their Hebrew spelling (ids can change when the data is rebuilt).

export const MAX_SAVED = 10;

/** Adds a winner if there is room and it isn't saved yet; otherwise returns the list unchanged. */
export function addIfRoom(saved: string[], name: string): string[] {
  if (saved.includes(name) || saved.length >= MAX_SAVED) return saved;
  return [...saved, name];
}

/** Puts `name` in the place of `old`. */
export function replaceName(saved: string[], old: string, name: string): string[] {
  if (!saved.includes(old) || saved.includes(name)) return saved;
  return saved.map((n) => (n === old ? name : n));
}
