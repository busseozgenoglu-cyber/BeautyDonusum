/** Build a data URI for raw base64 image bytes (handles API returning raw b64 or full data URLs). */
export function toImageDataUri(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.trim();
  if (t.startsWith('data:')) return t;
  return `data:image/png;base64,${t}`;
}
