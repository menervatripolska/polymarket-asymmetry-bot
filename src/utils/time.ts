export function nowIso(): string {
  return new Date().toISOString();
}

export function diffDays(fromIso?: string, toIso?: string): number | undefined {
  if (!fromIso || !toIso) {
    return undefined;
  }
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    return undefined;
  }
  return (to - from) / (1000 * 60 * 60 * 24);
}

